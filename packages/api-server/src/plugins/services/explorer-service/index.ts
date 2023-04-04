import fp from "fastify-plugin";
import {Job, Queue} from "bullmq";
import {
    APIError, BotResponseGenerateError,
    BotResponseParseError,
    ExplorerCreateQuestionError,
    ExplorerPrepareQuestionError, ExplorerRecommendQuestionError,
    ExplorerResolveQuestionError, ExplorerSetQuestionTagsError,
    ExplorerTooManyRequestError, ExplorerCancelRecommendQuestionError,
    SQLUnsupportedFunctionError,
    ValidateSQLError
} from "../../../utils/error";
import {Connection, PoolConnection, ResultSetHeader} from "mysql2/promise";
import crypto from "node:crypto";
import {DateTime} from "luxon";
import {BotService} from "../bot-service";
import {
    PlanStep,
    Question,
    QuestionFeedback,
    QuestionFeedbackType,
    QuestionQueryResult,
    QuestionQueryResultWithChart,
    QuestionQueueNames,
    QuestionSQLResult,
    QuestionStatus,
    ValidateSQLResult
} from "./types";
import {TiDBPlaygroundQueryExecutor} from "../../../core/executor/query-executor/TiDBPlaygroundQueryExecutor";
import {GenerateChartPromptTemplate} from "../bot-service/template/GenerateChartPromptTemplate";
import {randomUUID} from "crypto";
import {
    AnswerSummary,
    BarChart,
    ChartNames,
    LineChart,
    MapChart,
    NumberCard,
    PersonalCard,
    PieChart,
    QuestionTag,
    RecommendedChart,
    RecommendQuestion,
    RepoCard,
    Table
} from "../bot-service/types";
import {GenerateAnswerPromptTemplate} from "../bot-service/template/GenerateAnswerPromptTemplate";
import {FastifyBaseLogger} from "fastify";
import {MySQLPromisePool} from "@fastify/mysql";
import async from "async";
import {GenerateSummaryPromptTemplate} from "../bot-service/template/GenerateSummaryPromptTemplate";
import sleep from "../../../utils/sleep";
import {withConnection, withTransaction} from '../../../utils/connection';
import {pino} from "pino";
import BaseLogger = pino.BaseLogger;

declare module 'fastify' {
    interface FastifyInstance {
        explorerService: ExplorerService;
    }
}

export default fp(async (app: any) => {
    app.decorate('explorerService', new ExplorerService(
      app.log.child({service: 'explorer-service'}),
      app.mysql,
      app.botService,
      app.playgroundQueryExecutor,
      app.explorerLowConcurrentQueue,
      app.explorerHighConcurrentQueue,
      {
          userMaxQuestionsPerHour: app.config.EXPLORER_USER_MAX_QUESTIONS_PER_HOUR,
          userMaxQuestionsOnGoing: app.config.EXPLORER_USER_MAX_QUESTIONS_ON_GOING,
          trustedUsersMaxQuestionsPerHour: 200,
          generateSQLCacheTTL: app.config.EXPLORER_GENERATE_SQL_CACHE_TTL,
          querySQLCacheTTL: app.config.EXPLORER_QUERY_SQL_CACHE_TTL,
          outputAnswerInStream: app.config.EXPLORER_OUTPUT_ANSWER_IN_STREAM
      }
    ));
}, {
    name: '@ossinsight/explorer-service',
    dependencies: [
        '@fastify/env',
        'fastify-redis',
        '@ossinsight/bot-service',
        '@ossinsight/explorer-high-concurrent-queue',
        '@ossinsight/explorer-low-concurrent-queue'
    ]
});

export interface ExplorerOption {
    userMaxQuestionsPerHour: number;
    userMaxQuestionsOnGoing: number;
    trustedUsersMaxQuestionsPerHour: number;
    generateSQLCacheTTL: number;
    querySQLCacheTTL: number;
    querySQLTimeout: number;
    outputAnswerInStream: boolean;
}

export class ExplorerService {
    [x: string]: any;
    // TODO: replace node-sql-parser with tidb-sql-parser.
    // private sqlParser: Parser;
    private readonly generateAnswerTemplate: GenerateAnswerPromptTemplate;
    private readonly generateChartTemplate: GenerateChartPromptTemplate;
    private readonly generateAnswerSummaryTemplate: GenerateSummaryPromptTemplate;
    private options: ExplorerOption;

    constructor(
      private readonly logger: FastifyBaseLogger,
      private readonly mysql: MySQLPromisePool,
      private readonly botService: BotService,
      private readonly playgroundQueryExecutor: TiDBPlaygroundQueryExecutor,
      private readonly lowConcurrentQueue: Queue,
      private readonly highConcurrentQueue: Queue,
      options?: Partial<ExplorerOption>
    ) {
        this.generateChartTemplate = new GenerateChartPromptTemplate();
        this.generateAnswerTemplate = new GenerateAnswerPromptTemplate();
        this.generateAnswerSummaryTemplate = new GenerateSummaryPromptTemplate();
        this.options = Object.assign({}, {
            userMaxQuestionsPerHour: 20,
            userMaxQuestionsOnGoing: 3,
            trustedUsersMaxQuestionsPerHour: 200,
            generateSQLCacheTTL: 60 * 60 * 24 * 7,
            querySQLCacheTTL: 60 * 60 * 24,
            querySQLTimeout: 30 * 1000,
            outputAnswerInStream: false
        }, options || {});
    }

    async newQuestion(
      userId: number, q: string, ignoreCache: boolean = false, ignoreRateLimit: boolean = false, needReview: boolean = false,
      batchJobId: string | null = null, conn: Connection): Promise<Question> {
        // Init logger.
        const questionId = randomUUID();
        const logger = this.logger.child({ questionId: questionId });
        const normalizedQuestion = this.normalizeQuestion(q);
        if (normalizedQuestion.length > 512) {
            throw new APIError(400, 'The question too long, please shorten it.');
        }

        // Prepare the new question.
        logger.info("Creating a new question: %s", normalizedQuestion);
        const questionHash = this.getQuestionHash(normalizedQuestion);
        let question: Question = {
            id: questionId,
            hash: questionHash,
            userId: userId,
            status: QuestionStatus.New,
            title: q,
            recommendedQuestions: [],
            batchJobId: batchJobId,
            needReview: needReview,
            recommended: false,
            createdAt: DateTime.utc(),
            hitCache: false,
            preceding: 0
        }

        try {
            await conn.beginTransaction();

            // Check if the question is cached.
            if (!ignoreCache) {
                const cachedQuestion = await this.getLatestQuestionByHash(questionHash, this.options.generateSQLCacheTTL, conn);
                if (cachedQuestion) {
                    logger.info("Question is cached, returning cached question (hash: %s).", questionHash);

                    await conn.commit();
                    return {
                        ...cachedQuestion,
                        hitCache: true
                    };
                }
            }

            // Give the trusted users more daily requests.
            let limit = this.options.userMaxQuestionsPerHour;
            if (await this.checkIfTrustedUser(userId, conn)) {
                limit = this.options.trustedUsersMaxQuestionsPerHour;
            }

            if (!ignoreRateLimit) {
                // Notice: Using FOR UPDATE, pessimistic locking controls a single user to request question serially.
                const previousQuestions = await this.getUserPastHourQuestionsWithLock(userId, conn);
                if (previousQuestions.length >= limit) {
                    const oldestQuestion = previousQuestions.reduce((prev, current) => (prev.createdAt < current.createdAt) ? prev : current);
                    const now = DateTime.utc();
                    const waitMinutes = oldestQuestion.createdAt.diff(now.minus({ hour: 1 }), ["minutes", "seconds"]);
                    const waitMinutesText = waitMinutes.toHuman();
                    throw new ExplorerTooManyRequestError(`Too many questions request in the past hour, please wait ${waitMinutesText}.`, waitMinutes.minutes);
                }

                const onGongStatuses = [QuestionStatus.AnswerGenerating, QuestionStatus.SQLValidating, QuestionStatus.Waiting, QuestionStatus.Running];
                const onGongQuestions = previousQuestions.filter(q => onGongStatuses.includes(q.status));
                if (onGongQuestions.length >= this.options.userMaxQuestionsOnGoing) {
                    logger.info("There are %d previous question on going, cancel them.", onGongQuestions.length);
                    await this.cancelQuestions(conn, onGongQuestions.map(q => q.id));
                }
            }

            question.preceding = await this.countPrecedingQuestions(question.id, conn);

            await this.createQuestion(question, conn);
            await conn.commit();
        } catch (err: any) {
            await conn.rollback();
            logger.error(err, `Failed to create a new question: ${err.message}`);
            if (err instanceof ExplorerTooManyRequestError) {
                throw err;
            } else if (err instanceof APIError) {
                throw new ExplorerCreateQuestionError(err.statusCode, err.message, question, err);
            } else {
                throw new ExplorerCreateQuestionError(500, 'Failed to create the question', question);
            }
        }

        return question;
    }

    async prepareQuestion(question: Question) {
        const { id: questionId } = question;
        const logger = this.logger.child({ questionId: questionId });

        try {
            // Update question status.
            question.status = QuestionStatus.AnswerGenerating;
            await this.updateQuestion(question);

            // Generate the SQL by OpenAI.
            let outputInStream = this.options.outputAnswerInStream;
            await this.generateAnswer(logger, question, outputInStream);
            if (!question.sqlCanAnswer || typeof question.querySQL !== 'string' || question.querySQL.length === 0) {
                const message = 'Failed to generate SQL, the question may exceed the scope of what can be answered.';
                throw new ExplorerPrepareQuestionError(message, QuestionFeedbackType.ErrorSQLCanNotAnswer, {
                    message: message
                });
            }

            // Update question status.
            question.status = QuestionStatus.SQLValidating;
            question.queryHash = this.getQueryHash(question.querySQL);
            await this.updateQuestion(question);

            // Validate the generated SQL.
            let statementType;
            try {
                logger.info("Validating the generated SQL: %s", question.querySQL);
                const res = this.validateSQL(question.querySQL!);
                statementType = res.statementType;
            } catch (err: any) {
                if (err instanceof ValidateSQLError) {
                    throw new ExplorerPrepareQuestionError(err.message, QuestionFeedbackType.ErrorValidateSQL, {
                        message: err.message
                    });
                } else {
                    const message = 'Failed to validate the generated SQL.';
                    throw new ExplorerPrepareQuestionError(message, QuestionFeedbackType.ErrorValidateSQL, {
                        message: err.message
                    });
                }
            }

            // Try to get SQL result from cache.
            const cachedResult = await this.getCachedSQLResult(question.queryHash, this.options.querySQLCacheTTL);
            if (cachedResult) {
                logger.info("SQL result is cached, returning cached result (hash: %s).", question.queryHash);
                await this.saveQuestionResult(questionId, QuestionStatus.Success, cachedResult);
                question = {
                    ...question,
                    ...cachedResult,
                    status: QuestionStatus.Success,
                    hitCache: true,
                }
                await this.updateQuestion(question);
                return question;
            }

            // Get the storage engines that will be used in the SQL execution.
            question.engines = statementType === 'select' ? await this.getStorageEngines(logger, question.querySQL) : [];
            question.queueName = question.engines.includes('tiflash') ? QuestionQueueNames.Low : QuestionQueueNames.High;
            question.queueJobId = randomUUID();
            question.requestedAt = DateTime.utc();
            question.status = QuestionStatus.Waiting;
            await this.updateQuestion(question);

            // Push the question to the queue.
            await this.pushJobToQueue(logger, question);
        } catch (err: any) {
            if (err instanceof ExplorerPrepareQuestionError) {
                await this.updateQuestion({
                    ...question,
                    errorType: err.feedbackType,
                    status: QuestionStatus.Error,
                    error: this.wrapperTheErrorMessage(err.message),
                });
                await this.addSystemQuestionFeedback(questionId, err.feedbackType, JSON.stringify(err.feedbackPayload));
            } else {
                await this.updateQuestion({
                    ...question,
                    errorType: err.ErrorUnknown,
                    status: QuestionStatus.Error,
                    error: this.wrapperTheErrorMessage(err.message),
                });
                await this.addSystemQuestionFeedback(questionId, QuestionFeedbackType.ErrorUnknown, JSON.stringify({
                    message: err.message
                }));
            }
            throw err;
        }
    }

    async generateAnswer(logger: BaseLogger, question: Question, outputInStream: boolean): Promise<string | null> {
        let responseText: string | null = null;
        const { id: questionId, title } = question;
        const promptTemplate = this.generateAnswerTemplate;
        for (let i = 1; i <= 3; i++) {
            try {
                if (outputInStream) {
                    // Update the field one by one.
                    [question.answer, responseText] = await this.botService.questionToAnswerInStream(promptTemplate, title, async (answer, key, value) => {
                        // @ts-ignore
                        question[key] = value;
                        question.answer = answer;
                        try {
                            await this.updateQuestion(question);
                            logger.info(`Updating question with field ${key} = ${value}.`)
                        } catch (e) {
                            logger.error(e, `Failed to update question with field ${key} = ${value}.`)
                        }
                    });
                } else {
                    // Update all the fields at once.
                    [question.answer, responseText] = await this.botService.questionToAnswer(promptTemplate, title);
                    question.revisedTitle = question.answer?.revisedTitle;
                    question.notClear = question.answer?.notClear;
                    question.assumption = question.answer?.assumption;
                    question.combinedTitle = question.answer?.combinedTitle;
                    question.sqlCanAnswer = question.answer?.sqlCanAnswer;
                    question.querySQL = question.answer?.querySQL;
                    question.chart = question.answer?.chart;
                    await this.updateQuestion(question);
                    logger.info(`Updating question with all field.`)
                }

                // Check if there are an answer been returned.
                if (!question.answer || Object.keys(question.answer).length === 0) {
                    const message = 'Generated an empty answer.';
                    throw new BotResponseGenerateError(message, responseText);
                }

                return responseText;
            } catch (e: any) {
                // Reset the question and answer, and try again.
                if (i < 3) {
                    logger.warn(e, `Failed to generate answer for question ${questionId}, retrying (${i + 1}/3)...`);

                    question.revisedTitle = undefined;
                    question.notClear = undefined;
                    question.assumption = undefined;
                    question.combinedTitle = undefined;
                    question.sqlCanAnswer = undefined;
                    question.querySQL = undefined;
                    question.chart = undefined;

                    // Wait for a while before retrying.
                    await sleep(1000 * i);

                    // Notice: Disable the output in stream mode if it failed.
                    outputInStream = false;
                    continue;
                }

                if (e instanceof BotResponseParseError) {
                    throw new ExplorerPrepareQuestionError(e.message, QuestionFeedbackType.ErrorAnswerParse, {
                        message: e.message,
                        responseText: e.responseText,
                    }, e);
                } else if (e instanceof BotResponseGenerateError) {
                    throw new ExplorerPrepareQuestionError(e.message, QuestionFeedbackType.ErrorAnswerGenerate, {
                        message: e.message,
                        responseText: e.responseText,
                    }, e);
                } else {
                    const message = 'Failed to generate answer, please try again later';
                    throw new ExplorerPrepareQuestionError(message, QuestionFeedbackType.ErrorAnswerGenerate, {
                        message: e.message
                    }, e);
                }
            }
        }
        return responseText;
    }

    async getStorageEngines(logger: BaseLogger, querySQL: string): Promise<string[]> {
        try {
            logger.info("Getting the storage engines for the SQL: %s", querySQL);
            const plan = await this.getSQLExecutionPlan(querySQL);
            return this.getStorageEnginesFromPlan(plan);
        } catch (err: any) {
            if (err.sqlMessage) {
                throw new ExplorerPrepareQuestionError(err.sqlMessage, QuestionFeedbackType.ErrorValidateSQL, {
                    sqlMessage: err.sqlMessage,
                    message: err.message,
                    sql: querySQL
                });
            } else {
                const message = 'Failed to validate the generated SQL.';
                throw new ExplorerPrepareQuestionError(message, QuestionFeedbackType.ErrorValidateSQL, {
                    message: err.message,
                    sql: querySQL
                });
            }
        }
    }

    async pushJobToQueue(logger: BaseLogger, question: Question) {
        if (!question.queueJobId) {
            logger.warn("No job id provided, the question will not be executed.");
            return;
        }

        const log = this.logger.child({ jobId: question.queueJobId });
        if (!question.queueName) {
            log.warn("No queue name provided, the question will not be executed.");
            return;
        }


        switch (question.queueName) {
            case QuestionQueueNames.Low:
                log.info("Pushing the question to the low concurrent queue.");
                await this.lowConcurrentQueue.add(QuestionQueueNames.Low, question, {
                    jobId: question.queueJobId
                });
                break;
            case QuestionQueueNames.High:
                log.info("Pushing the question to the high concurrent queue.");
                await this.highConcurrentQueue.add(QuestionQueueNames.High, question, {
                    jobId: question.queueJobId
                });
                break;
            default:
                log.warn("No queue name provided, the question will not be executed.");
                break;
        }
    }

    private normalizeQuestion(question: string): string {
        return question.replaceAll(/\s+/g, ' ');
    }

    private validateSQL(sql: string): ValidateSQLResult {
        // Notice: node-sql-parser doesn't support `SHOW INDEXES FROM` syntax.
        if (/^show\s+indexes\s+from\s+\S+/igm.test(sql)) {
            return {
                sql: sql,
                statementType: 'show',
            };
        }

        if (/rand\(.*\)/ig.test(sql)) {
            throw new SQLUnsupportedFunctionError( 'Didn\'t support SQL contains `rand()` function');
        }

        if (/sleep\(.*\)/ig.test(sql)) {
            throw new SQLUnsupportedFunctionError( 'Didn\'t support SQL contains `sleep()` function');
        }

        return {
            sql: sql,
            statementType: 'select'
        };
    }

    async getSQLExecutionPlan(sql: string, conn?: Connection) {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>('explain format = "brief" ' + sql);
        return rows;
    }

    getStorageEnginesFromPlan(steps: PlanStep[]):string[] {
        if (!Array.isArray(steps)) return [];

        const engines = new Set<string>();
        for (const step of steps) {
            if (step.task.includes('tiflash')) {
                engines.add('tiflash');
            } else if (step.task.includes('tikv')) {
                engines.add('tikv');
            }
        }

        const engineValues = [];
        for (const engine of engines) {
            engineValues.push(engine);
        }

        return engineValues;
    }

    private getQueryHash(sql: string): string {
        sql.replaceAll(/\s+/g, ' ');
        return crypto.createHash('sha256').update(sql, 'binary').digest('hex');
    }

    private getQuestionHash(sql: string): string {
        sql.replaceAll(/\s+/g, ' ');
        return crypto.createHash('sha256').update(sql, 'binary').digest('hex');
    }

    // CRUD.

    private async createQuestion(question: Question, conn?: Connection) {
        const connection = conn || this.mysql;
        const {
            id, hash, userId, status, title, querySQL, queryHash, engines = [],
            batchJobId = null, needReview, recommended, createdAt, queueName, queueJobId = null, chart, recommendedQuestions = [], error = null
        } = question;
        const enginesValue = JSON.stringify(engines);
        const chartValue = chart !== undefined ? JSON.stringify(chart) : null;
        const recommendedQuestionsValue = JSON.stringify(recommendedQuestions);
        const [rs] = await connection.query<ResultSetHeader>(`
            INSERT INTO explorer_questions(
                id, hash, user_id, status, title, query_sql, query_hash, engines,
                batch_job_id, need_review, recommended, created_at, queue_name, queue_job_id, chart, recommended_questions, error
            ) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, hash, userId, status, title, querySQL, queryHash, enginesValue,
            batchJobId, needReview, recommended, createdAt.toSQL(), queueName, queueJobId, chartValue, recommendedQuestionsValue, error
        ]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to create a new question.');
        }
    }

    private async cancelQuestions(conn: Connection, questionIds: string[]) {
        const [rs] = await conn.query<ResultSetHeader>(`
            UPDATE explorer_questions SET status = ? WHERE id IN (${questionIds.map(() => "UUID_TO_BIN(?)").join(", ")})
        `, [QuestionStatus.Cancel, ...questionIds]);
        if (rs.affectedRows === 0) {
            throw new APIError(500, 'Failed to cancel the question.');
        }
    }

    private async updateQuestionStatus(questionId: string, status: QuestionStatus) {
        const [rs] = await this.mysql.query<ResultSetHeader>(`
            UPDATE explorer_questions SET status = ? WHERE id = UUID_TO_BIN(?)
        `, [status, questionId]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to update the question status.');
        }
    }

    private async markQuestionRunning(questionId: string, executedAt?: DateTime) {
        const [rs] = await this.mysql.query<ResultSetHeader>(`
            UPDATE explorer_questions SET status = ?, executed_at = ? WHERE id = UUID_TO_BIN(?)
        `, [QuestionStatus.Running, executedAt?.toSQL() || null, questionId]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to update the question status.');
        }
    }

    async updateQuestion(question: Question) {
        const {
            id, answer = null, revisedTitle = null, notClear = null, assumption = null, combinedTitle = null, status, recommended, sqlCanAnswer = true,
            querySQL, queryHash, engines = [], result = null, chart = null, recommendedQuestions = [],
            queueName = null, queueJobId = null, requestedAt, executedAt, finishedAt, spent, errorType = null, error = null
        } = question;

        const answerValue = answer !== undefined ? JSON.stringify(answer) : null;
        const enginesValue = JSON.stringify(engines);
        const resultValue = result !== undefined ? JSON.stringify(result) : null;
        const chartValue = chart !== undefined ? JSON.stringify(chart) : null;
        const recommendedQuestionsValue = JSON.stringify(recommendedQuestions);
        const requestedAtValue = requestedAt ? requestedAt.toSQL() : null;
        const executedAtValue = executedAt ? executedAt.toSQL() : null;
        const finishedAtValue = finishedAt ? finishedAt.toSQL() : null;

        await withTransaction(this.mysql, async (conn) => {
            const [rs] = await conn.query<ResultSetHeader>(`
                UPDATE explorer_questions
                SET
                    answer = ?, revised_title = ?, not_clear = ?, assumption = ?, combined_title = ?, status = ?, recommended = ?, sql_can_answer = ?, 
                    query_sql = ?, query_hash = ?, engines = ?, result = ?, chart = ?, recommended_questions = ?, 
                    queue_name = ?, queue_job_id = ?, requested_at = ?, executed_at = ?, finished_at = ?, spent = ?, error_type = ?, error = ?
                WHERE id = UUID_TO_BIN(?)
            `, [
                answerValue, revisedTitle, notClear, assumption, combinedTitle, status, recommended, sqlCanAnswer,
                querySQL, queryHash, enginesValue, resultValue, chartValue, recommendedQuestionsValue,
                queueName, queueJobId, requestedAtValue, executedAtValue, finishedAtValue, spent, errorType, error, id
            ]);

            if (rs.affectedRows !== 1) {
                throw new APIError(500, 'Failed to update the question.');
            }
        });
    }

    private async saveQuestionResult(questionId: string, status: QuestionStatus, questionResult: QuestionQueryResult, hitCache = false, conn?: Connection) {
        const connection = conn || this.mysql;
        const { result, executedAt, finishedAt, spent } = questionResult;
        const [rs] = await connection.query<ResultSetHeader>(`
            UPDATE explorer_questions
            SET status = ?, result = ?, executed_at = ?, finished_at = ?, spent = ?, hit_cache = ?
            WHERE id = UUID_TO_BIN(?)
        `, [
            status,
            JSON.stringify(result),
            executedAt.toSQL(),
            finishedAt.toSQL(),
            spent,
            hitCache,
            questionId
        ]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to save the question result.');
        }
    }

    private async saveQuestionError(
      questionId: string, errorType: QuestionFeedbackType = QuestionFeedbackType.ErrorUnknown,
      message: string = 'unknown', conn?: Connection
    ) {
        const connection = conn || this.mysql;
        const [rs] = await connection.query<ResultSetHeader>(`
            UPDATE explorer_questions SET status = ?, error_type = ?, error = ? WHERE id = UUID_TO_BIN(?)
        `, [QuestionStatus.Error, errorType, message, questionId]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to update the question error.');
        }
    }

    private async saveAnswerSummary(questionId: string, summary: AnswerSummary, conn?: Connection) {
        const connection = conn || this.mysql;
        const summaryValue = JSON.stringify(summary);
        const [rs] = await connection.query<ResultSetHeader>(`
            UPDATE explorer_questions
            SET answer_summary = ?
            WHERE id = UUID_TO_BIN(?)
        `, [summaryValue, questionId]);
        if (rs.affectedRows === 0) {
            throw new APIError(500, 'Failed to save the answer summary.');
        }
    }

    async getQuestionById(questionId: string, conn?: Connection): Promise<Question | null> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT
                BIN_TO_UUID(id) AS id, hash, user_id AS userId, status, title, answer, revised_title AS revisedTitle, not_clear AS notClear, 
                assumption, combined_title AS combinedTitle, sql_can_answer AS sqlCanAnswer, query_sql AS querySQL, query_hash AS queryHash, engines, 
                queue_name AS queueName, queue_job_id AS queueJobId, recommended_questions AS recommendedQuestions, 
                result, chart, answer_summary AS answerSummary, recommended, hit_cache AS hitCache, 
                created_at AS createdAt, requested_at AS requestedAt, executed_at AS executedAt, finished_at AS finishedAt, 
                spent, error_type AS errorType, error
            FROM explorer_questions
            WHERE id = UUID_TO_BIN(?)
        `, [questionId]);
        if (rows.length !== 1) {
            return null;
        }
        return this.mapRecordToQuestion(rows[0]);
    }

    async getQuestionByIdOrError(questionId: string, conn?: Connection): Promise<Question> {
        const question = await this.getQuestionById(questionId, conn);
        if (question === null) {
            throw new APIError(404, 'Question not found.');
        }
        return question;
    }

    async getLatestQuestionByHash(questionHash: string, ttl: number, conn?: Connection): Promise<Question | null> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT
                BIN_TO_UUID(id) AS id, hash, user_id AS userId, status, title, answer, revised_title AS revisedTitle, not_clear AS notClear,
                assumption, combined_title AS combinedTitle, sql_can_answer AS sqlCanAnswer, query_sql AS querySQL, query_hash AS queryHash, engines,
                queue_name AS queueName, queue_job_id AS queueJobId, recommended_questions AS recommendedQuestions,
                result, chart, answer_summary AS answerSummary, recommended, hit_cache AS hitCache,
                created_at AS createdAt, requested_at AS requestedAt, executed_at AS executedAt, finished_at AS finishedAt,
                spent, error_type AS errorType, error
            FROM explorer_questions
            WHERE
                hash = ?
                AND status IN (?)
                AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
            ORDER BY created_at DESC
            LIMIT 1
        `, [questionHash, QuestionStatus.Success, ttl]);
        if (rows.length !== 1) {
            return null;
        }
        return this.mapRecordToQuestion(rows[0]);
    }

    async getRecommendedQuestionsByHash(questionHash: string, conn?: Connection): Promise<Question[]> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT
                BIN_TO_UUID(id) AS id, hash, user_id AS userId, status, title, revised_title AS revisedTitle, not_clear AS notClear,
                assumption, combined_title AS combinedTitle, sql_can_answer AS sqlCanAnswer, query_sql AS querySQL, query_hash AS queryHash, engines,
                queue_name AS queueName, queue_job_id AS queueJobId, recommended_questions AS recommendedQuestions,
                result, chart, answer_summary AS answerSummary, recommended, hit_cache AS hitCache,
                created_at AS createdAt, requested_at AS requestedAt, executed_at AS executedAt, finished_at AS finishedAt,
                spent, error_type AS errorType, error
            FROM explorer_questions
            WHERE hash = ? AND recommended = 1
        `, [questionHash]);
        return rows.map(this.mapRecordToQuestion);
    }

    async getLatestQuestionByQueryHash(queryHash: string, ttl: number): Promise<Question | null> {
        const [rows] = await this.mysql.query<any[]>(`
            SELECT
                BIN_TO_UUID(id) AS id, hash, user_id AS userId, status, title, answer, revised_title AS revisedTitle, not_clear AS notClear,
                assumption, combined_title AS combinedTitle, sql_can_answer AS sqlCanAnswer, query_sql AS querySQL, query_hash AS queryHash, engines,
                queue_name AS queueName, queue_job_id AS queueJobId, recommended_questions AS recommendedQuestions,
                result, chart, answer_summary AS answerSummary, recommended, hit_cache AS hitCache,
                created_at AS createdAt, requested_at AS requestedAt, executed_at AS executedAt, finished_at AS finishedAt,
                spent, error_type AS errorType, error
            FROM explorer_questions
            WHERE query_hash = ? AND status = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
            ORDER BY created_at DESC
            LIMIT 1
        `, [queryHash, QuestionStatus.Success, ttl]);
        if (rows.length !== 1) {
            return null;
        }
        return this.mapRecordToQuestion(rows[0]);
    }

    async getCachedSQLResult(queryHash: string, ttl: number): Promise<QuestionQueryResultWithChart | null> {
        if (!queryHash) {
            return null;
        }
        const question = await this.getLatestQuestionByQueryHash(queryHash, ttl);
        if (!question) {
            return null;
        }
        return {
            result: question.result!,
            executedAt: question.executedAt!,
            finishedAt: question.finishedAt!,
            spent: question.spent!,
            chart: question.chart!,
        }
    }

    async getUserPastHourQuestionsWithLock(userId: number, conn?: Connection): Promise<Question[]> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT
                BIN_TO_UUID(id) AS id, hash, user_id AS userId, status, title, answer, revised_title AS revisedTitle, not_clear AS notClear,
                assumption, combined_title AS combinedTitle, sql_can_answer AS sqlCanAnswer, query_sql AS querySQL, query_hash AS queryHash, engines,
                queue_name AS queueName, queue_job_id AS queueJobId, recommended_questions AS recommendedQuestions,
                result, chart, answer_summary AS answerSummary, recommended, hit_cache AS hitCache,
                created_at AS createdAt, requested_at AS requestedAt, executed_at AS executedAt, finished_at AS finishedAt,
                spent, error_type AS errorType, error
            FROM explorer_questions
            WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ORDER BY created_at DESC
            FOR UPDATE
        `, [userId]);
        return rows.map(row => this.mapRecordToQuestion(row));
    }

    mapRecordToQuestion(row: any): Question {
        return {
            ...row,
            sqlCanAnswer: row.sqlCanAnswer === 1,
            recommended: row.recommended === 1,
            hitCache: row.hitCache === 1,
            createdAt: row.createdAt instanceof Date ? DateTime.fromJSDate(row.createdAt) : undefined,
            requestedAt: row.createdAt instanceof Date ? DateTime.fromJSDate(row.requestedAt) : undefined,
            executedAt: row.createdAt instanceof Date ? DateTime.fromJSDate(row.executedAt) : undefined,
            finishedAt: row.createdAt instanceof Date ? DateTime.fromJSDate(row.finishedAt) : undefined,
        }
    }

    async countPrecedingQuestions(questionId: string, conn?: Connection): Promise<number> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT COUNT(*) AS count
            FROM explorer_questions eq
            WHERE
                status IN (?)
                AND created_at < (SELECT created_at FROM explorer_questions WHERE id = UUID_TO_BIN(?))
                AND queue_name = (SELECT queue_name FROM explorer_questions WHERE id = UUID_TO_BIN(?))
        `, [[QuestionStatus.Running, QuestionStatus.Waiting], questionId, questionId]);
        return rows[0].count;
    }

    // Resolve questions.

    async resolveQuestion(job: Job, question: Question): Promise<QuestionQueryResult> {
        const { id: questionId, querySQL } = question;
        try {
            const questionResult = await this.executeQuery(questionId, querySQL!);
            if (this.playgroundQueryExecutor.shadowConnections) {
                this.executeQuery(questionId, querySQL!, true).catch(err => {
                    this.logger.error(err, `Failed to execute shadow query for question ${questionId}.`)
                }).then(() => {
                    this.logger.info(`Shadow query for question ${questionId} finished.`)
                });
            }

            // Check chart if match the result.
            if (!this.checkChart(question.chart, questionResult.result)) {
                await this.addSystemQuestionFeedback(questionId, QuestionFeedbackType.ErrorValidateChart, JSON.stringify(question.chart));
            }

            // Check if the result is empty.
            const hasQueryResult = Array.isArray(questionResult.result.rows) && questionResult.result.rows.length > 0;
            if (!hasQueryResult) {
                await this.addSystemQuestionFeedback(questionId, QuestionFeedbackType.ErrorEmptyResult, JSON.stringify(questionResult.result));
            }

            // Answer summary.
            if (hasQueryResult && this.shouldSummary()) {
                await this.saveQuestionResult(questionId, QuestionStatus.Summarizing, {
                    ...questionResult,
                }, false);

                try {
                    await this.generateAnswerSummary(questionId, question.title, questionResult.result);
                } catch (err: any) {
                    this.logger.warn(`Failed to generate answer summary for question ${questionId}: ${err.message}`);
                    await this.addSystemQuestionFeedback(questionId, QuestionFeedbackType.ErrorSummaryGenerate, JSON.stringify(questionResult.result));
                }

                await this.updateQuestionStatus(questionId, QuestionStatus.Success);
            } else {
                await this.saveQuestionResult(questionId, QuestionStatus.Success, {
                    ...questionResult,
                }, false);
            }

            return questionResult;
        } catch (err: any) {
            if (err instanceof ExplorerResolveQuestionError) {
                await this.addSystemQuestionFeedback(questionId, err.feedbackType, JSON.stringify(err.feedbackPayload));
                await this.saveQuestionError(questionId, err.feedbackType, err.message);
            } else {
                const userMessage = "Failed to resolve question, please try again later.";
                await this.addSystemQuestionFeedback(questionId, QuestionFeedbackType.ErrorUnknown, JSON.stringify({
                    message: err.message,
                }));
                await this.saveQuestionError(questionId, QuestionFeedbackType.ErrorUnknown, userMessage);
            }
            throw err;
        }
    }

    private shouldSummary(): boolean {
        // Control the summary probability to 2 / 5.
        return Math.ceil(Math.random() * 100) % 5 >= 3;
    }

    private async executeQuery(questionId: string, querySQL: string, shadow: boolean = false): Promise<QuestionQueryResult> {
        const logger = this.logger.child({ questionId });
        const timeout = this.options.querySQLTimeout;
        const preparedSQL = `/* questionId: ${questionId} */ ${querySQL}`;

        return new Promise<QuestionQueryResult>(async (resolve, reject) => {
            let playgroundConn: PoolConnection | null = null;
            let timer: NodeJS.Timeout | null = null;

            try {
                // Get playground connection.
                const getConnStart = DateTime.now();
                if (shadow) {
                    playgroundConn = await this.playgroundQueryExecutor.getShadowConnection();
                } else {
                    playgroundConn = await this.playgroundQueryExecutor.getConnection();
                }
                const getConnEnd = DateTime.now();
                logger.info({questionId}, `Got the playground connection, cost: ${getConnEnd.diff(getConnStart).as('milliseconds')} ms`);

                // Mark question as running.
                const connectionId = await this.getConnectionID(playgroundConn);
                logger.info({ questionId }, 'Start executing query with connection ID: %s.', connectionId);
                const executedAt = DateTime.now();

                if (!shadow) {
                    await this.markQuestionRunning(questionId, executedAt);
                }

                // Cancel the query if timeout.
                timer = setTimeout(async () => {
                    logger.warn({ questionId, querySQL }, 'Query execution timeout after %d ms.', timeout);

                    try {
                        if (playgroundConn) {
                            // Close the connection from client side.
                            await playgroundConn.destroy();
                            logger.info('Move the connection from %s the pool.', connectionId);

                            // Terminate the connection from server side.
                            if (connectionId) {
                                await this.killConnection(connectionId);
                                logger.info('Killed the connection %s on server.', connectionId);
                            }
                        }

                        reject(new ExplorerResolveQuestionError('Query execution timeout.', QuestionFeedbackType.ErrorQueryTimeout,{
                            timeout: timeout,
                            querySQL,
                        }));
                    } catch (err) {
                        logger.error({ err }, 'Failed to kill the connection %s.', connectionId);
                        reject(new ExplorerResolveQuestionError('Query execution timeout.', QuestionFeedbackType.ErrorQueryTimeout,{
                            timeout: timeout,
                            querySQL,
                        }));
                    } finally {
                        if (timer) {
                            clearTimeout(timer);
                            timer = null;
                        }

                        if (playgroundConn) {
                            await playgroundConn.release();
                        }
                    }
                }, timeout);

                // Executing query.
                let rows: any[] = [], fields: any[] = [];
                try {
                    [rows, fields] = await playgroundConn.execute<any[]>(preparedSQL);
                } catch (err: any) {
                    if (err.sqlMessage) {
                        throw new ExplorerResolveQuestionError(err.sqlMessage, QuestionFeedbackType.ErrorQueryExecute,{
                            querySQL,
                            sqlMessage: err.sqlMessage,
                            message: err.message
                        });
                    } else {
                        throw new ExplorerResolveQuestionError(err.message, QuestionFeedbackType.ErrorQueryExecute,{
                            querySQL,
                            message: err.message
                        });
                    }
                }

                // Finish the query.
                const finishedAt = DateTime.now();
                const spent = finishedAt.diff(executedAt).as("seconds");
                logger.info({questionId}, 'Finished query executing, cost: %d s', spent);

                resolve({
                    result: {
                        fields: fields.map((field) => {
                            return {
                                name: field.name,
                                columnType: field.type,
                            }
                        }),
                        rows
                    },
                    executedAt,
                    finishedAt,
                    spent,
                });
            } catch (err) {
                reject(err);
            } finally {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }

                if (playgroundConn) {
                    await playgroundConn.release();
                }
            }
        });
    }

    private async getConnectionID(conn: Connection): Promise<string | null> {
        const [rows] = await conn.query<any[]>(`SELECT CAST(CONNECTION_ID() AS CHAR) AS connectionId`);

        if (rows.length === 0) {
            return null;
        }

        return rows[0].connectionId;
    }

    private async killConnection(taskId: string): Promise<boolean> {
        for (let i = 0; i < 3; i++) {
            try {
                await this.mysql.query(`KILL ${taskId}`);
                return true;
            } catch (e: any) {
                this.logger.warn(`Failed to kill query ${taskId}: ${e.message}, retrying...`);
            }
        }
        return false;
    }

    private checkChart(chart: RecommendedChart | undefined | null, result: QuestionSQLResult): boolean {
        if (chart === null || chart === undefined) {
            return false;
        }

        const columnNames = result.fields.map((f) => f.name);

        switch (chart.chartName) {
            case ChartNames.TABLE:
                const table: Table = chart as any;
                if (Array.isArray(table.columns) && table.columns.length > 0) {
                    return table.columns.every((column) => this.isValidColumn(column, columnNames));
                } else {
                    return false;
                }
            case ChartNames.NUMBER_CARD:
                const numberCard: NumberCard = chart as any;

                // Notice: the label column is optional.
                if (numberCard.label && !this.isValidColumn(numberCard.label, columnNames)) {
                    return false;
                }

                return this.isValidColumn(numberCard.value, columnNames);
            case ChartNames.BAR_CHART:
                const barChart: BarChart = chart as any;

                if (!this.isValidColumn(barChart.x, columnNames)) {
                    return false;
                }

                if (Array.isArray(barChart.y) && barChart.y.length > 0) {
                    return barChart.y.every((column) => this.isValidColumn(column, columnNames));
                } else if (typeof barChart.y === 'string') {
                    return this.isValidColumn(barChart.y, columnNames);
                } else {
                    return false;
                }
            case ChartNames.LINE_CHART:
                const lineChart: LineChart = chart as any;

                if (!this.isValidColumn(lineChart.x, columnNames)) {
                    return false;
                }

                if (Array.isArray(lineChart.y) && lineChart.y.length > 0) {
                    return lineChart.y.every((column) => this.isValidColumn(column, columnNames));
                } else if (typeof lineChart.y === 'string') {
                    return this.isValidColumn(lineChart.y, columnNames);
                } else {
                    return false;
                }
            case ChartNames.PIE_CHART:
                const pieChart: PieChart = chart as any;
                return this.isValidColumn(pieChart.label, columnNames) && this.isValidColumn(pieChart.value, columnNames);
            case ChartNames.MAP_CHART:
                const mapChart: MapChart = chart as any;
                return this.isValidColumn(mapChart.country_code, columnNames) && this.isValidColumn(mapChart.value, columnNames);
            case ChartNames.PERSONAL_CARD:
                const personalCard: PersonalCard = chart as any;
                return this.isValidColumn(personalCard.user_login, columnNames);
            case ChartNames.REPO_CARD:
                const repoCard: RepoCard = chart as any;
                return this.isValidColumn(repoCard.repo_name, columnNames);
            default:
                return false;
        }
    }

    private isValidColumn(column: any, columns: string[]): boolean {
        return typeof column === 'string' && columns.includes(column);
    }

    // Error handling.

    wrapperTheErrorMessage(message?: string | null): string {
        if (typeof message !== 'string') {
            return '';
        }

        if (message.includes('denied for user')) {
            message = 'Failed to execute SQL: commend access denied';
        } else if (message.includes('connect ECONNREFUSED')) {
            message = 'Failed to connect database, please try again later.';
        } else if (message.includes('rpc error: code = Unavailable')) {
            message= 'Failed to execute SQL, some of TiFlash nodes are unavailable, please try again later.';
        }

        return message;
    }

    // Chart.

    async generateChart(conn: Connection, questionId: string, title: string, result: QuestionSQLResult): Promise<RecommendedChart> {
        const { rows } = result;
        const sampleData = rows.slice(0, 2);

        let chart;
        try {
            // Generate chart according the query result by AI.
            chart = await this.botService.dataToChart(this.generateChartTemplate, title, sampleData);
        } catch (err: any) {
            this.logger.error(err, `Failed to generate chart for question ${questionId}: ${err.message}`);
        } finally {
            if (!chart) {
                chart = {
                    chartName: ChartNames.TABLE,
                    columns: sampleData[0] ? Object.keys(sampleData[0]) : []
                }
            }
        }

        await this.saveQuestionChart(questionId, chart, conn);
        return chart;
    }

    async generateChartByQuestionId(conn: Connection, questionId: string) {
        const question = await this.getQuestionById(questionId, conn);
        if (!question) {
            throw new APIError(404, 'Question not found.');
        }
        if (question.status !== QuestionStatus.Success || !question.result) {
            throw new APIError(409, 'The SQL query to resolve the question has not been finished.');
        }

        const { id, title, result } = question;
        return this.generateChart(conn, id, title, result);
    }

    private async saveQuestionChart(questionId: string, chart: RecommendedChart, conn?: Connection) {
        const connection = conn || this.mysql;
        const [rs] = await connection.query<ResultSetHeader>(`
            UPDATE explorer_questions SET chart = ? WHERE id = UUID_TO_BIN(?)
        `, [JSON.stringify(chart), questionId]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to update the question chart.');
        }
    }

    // Recommend questions.

    async getTags(conn?: Connection): Promise<QuestionTag[]> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT id, label, color, sort, created_at AS createdAt
            FROM explorer_question_tags eqt
            ORDER BY eqt.sort
        `);
        return this.mapQuestionTags(rows);
    }

    async getQuestionTags(questionId: string, conn?: Connection): Promise<QuestionTag[]> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT id, label, color, sort, created_at AS createdAt
            FROM explorer_question_tags eqt
            JOIN explorer_question_tag_rel eqtr ON eqtr.tag_id = eqt.id
            WHERE eqtr.question_id = UUID_TO_BIN(?)
        `, [questionId]);
        return this.mapQuestionTags(rows);
    }

    mapQuestionTags(rows: any[]): QuestionTag[] {
        return rows.map((r) => {
            return {
                ...r,
                createdAt: r.createdAt instanceof Date ? DateTime.fromJSDate(r.createdAt) : null,
            }
        });
    }

    async setQuestionTags(questionId: string, newTagIds: number[], conn?: Connection): Promise<void> {
        const connection = conn || await this.mysql.getConnection();
        await connection.beginTransaction();

        try {
            const existedTags = await this.getQuestionTags(questionId, connection);
            const existedTagIds = existedTags.map((t) => t.id);

            // Remove tags didn't exist in newTagIds.
            const needRemoveTagIds = existedTagIds.filter((id) => !newTagIds.includes(id));
            if (Array.isArray(needRemoveTagIds) && needRemoveTagIds.length > 0) {
                await connection.query(`
                    DELETE FROM explorer_question_tag_rel eqtr
                    WHERE
                        eqtr.question_id = UUID_TO_BIN(?)
                        AND eqtr.tag_id IN (?)
                `, [questionId, needRemoveTagIds]);
            }

            // Add tags didn't exist in existedTagIds.
            const needAddTags = newTagIds.filter((id) => !existedTagIds.includes(id));
            if (Array.isArray(needAddTags) && needAddTags.length > 0) {
                await connection.query(`
                    INSERT INTO explorer_question_tag_rel (question_id, tag_id)
                    VALUES ${needAddTags.map(() => '(UUID_TO_BIN(?), ?)').join(',')}
                `, needAddTags.map((id) => {
                    return [questionId, id];
                }).flat());
            }

            await connection.commit();
        } catch (err: any) {
            await connection.rollback();
            const message = 'Failed to set question tags.';
            this.logger.error({
                questionId: questionId,
                tagIds: newTagIds,
                err,
            }, message);
            throw new ExplorerSetQuestionTagsError(500, message,err);
        } finally {
            // @ts-ignore
            if (connection.release) {
                // @ts-ignore
                await connection.release();
            } else {
                await connection.end();
            }
        }
    }

    // Recommend questions.

    async getRecommendQuestionsByRandom(n: number, aiGenerated?: boolean, conn?: Connection): Promise<RecommendQuestion[]> {
        const connection = conn || this.mysql;
        let questions = [];
        try {
            if (aiGenerated !== undefined) {
                [questions] = await connection.query<any[]>(`
                SELECT hash, title, ai_generated AS aiGenerated, BIN_TO_UUID(question_id) AS questionId, created_at AS createdAt
                FROM explorer_recommend_questions erq
                WHERE ai_generated = ?
                ORDER BY RAND()
                LIMIT ?
            `, [aiGenerated, n]);
            } else {
                [questions] = await connection.query<any[]>(`
                SELECT hash, title, ai_generated AS aiGenerated, BIN_TO_UUID(question_id) AS questionId, created_at AS createdAt
                FROM explorer_recommend_questions erq
                ORDER BY RAND()
                LIMIT ?
            `, [n]);
            }
        } catch (err: any) {
            this.logger.error(`Failed to get recommend questions: ${err.message}`);
        }

        return this.mapToRecommendQuestions(questions);
    }

    async getRecommendQuestionsByTag(n: number = 40, tagId?: number | null, conn?: Connection): Promise<RecommendQuestion[]> {
        const connection = conn || this.mysql;

        let questions: any[];
        if (tagId) {
            [questions] = await connection.query<any[]>(`
                SELECT eq.hash, eq.title, false AS aiGenerated, BIN_TO_UUID(eq.id) AS questionId, eq.created_at AS createdAt
                FROM explorer_questions eq
                JOIN explorer_question_tag_rel eqtr ON eqtr.question_id = eq.id
                WHERE
                    recommended = 1
                    AND tag_id = ?
                ORDER BY RAND()
                LIMIT ?
            `, [tagId, n])
        } else {
            [questions] = await connection.query<any[]>(`
                SELECT eq.hash, eq.title, false AS aiGenerated, BIN_TO_UUID(eq.id) AS questionId, eq.created_at AS createdAt
                FROM explorer_questions eq
                WHERE
                    recommended = 1
                ORDER BY RAND()
                LIMIT ?
            `, [n])
        }

        const questionIds = questions.map((q) => q.questionId);
        if (questionIds.length > 0) {
            const [questionTags] = await connection.query<any[]>(`
                SELECT BIN_TO_UUID(question_id) AS questionId, eqt.id, eqt.label, eqt.color
                FROM explorer_question_tag_rel eqtr
                JOIN explorer_question_tags eqt ON eqt.id = eqtr.tag_id
                WHERE question_id IN (${
                  questionIds.map((id) => `UUID_TO_BIN('${id}')`).join(',')
                })
            `);

            questions.forEach((q) => {
                q.tags = questionTags.filter((qt) => qt.questionId === q.questionId).map((qt) => {
                    return {
                        id: qt.id,
                        label: qt.label,
                        color: qt.color,
                    }
                });
            });
        }

        return this.mapToRecommendQuestions(questions);
    }

    async mapToRecommendQuestions(rows: any[]): Promise<RecommendQuestion[]> {
        return rows.map((row) => ({
            hash: row.hash,
            title: row.title,
            aiGenerated: row.aiGenerated === 1,
            questionId: row.questionId,
            createdAt: DateTime.fromJSDate(row.createdAt),
            tags: row.tags || [],
        }));
    }

    async saveRecommendQuestions(conn: Connection, questions: RecommendQuestion[]): Promise<void> {
        const questionValues = questions.filter((q) => {
            return q.title != ''
        }).map(({ hash, title, aiGenerated }) => {
            const hashValue = hash ? hash : this.getQuestionHash(title);
            const aiGeneratedValue = aiGenerated || false;
            return [hashValue, title, aiGeneratedValue];
        })
        if (questionValues.length === 0) {
            return;
        }
        const [rs] = await conn.query<ResultSetHeader>(`
            INSERT INTO explorer_recommend_questions(hash, title, ai_generated)
            VALUES ?
            ON DUPLICATE KEY UPDATE title = VALUES(title), ai_generated = VALUES(ai_generated)
        `, [questionValues]);
        if (rs.affectedRows === 0) {
            throw new APIError(500, 'Failed to save the recommend questions.');
        }
    }

    async recommendQuestion(questionId: string, conn?: Connection): Promise<void> {
        const connection: Connection | PoolConnection = conn || await this.mysql.getConnection();
        const question = await this.getQuestionByIdOrError(questionId, connection);

        await connection.beginTransaction();
        try {
            const hash = question?.hash;
            if (!hash) {
                throw new ExplorerRecommendQuestionError(401, 'Question hash is empty.');
            }

            const oldQuestions = await this.getRecommendedQuestionsByHash(hash, connection);
            const oldQuestionIds = oldQuestions.map((q) => q.id);
            let oldTagIds: number[] = [];
            if (Array.isArray(oldQuestionIds) && oldQuestionIds.length > 0) {
                // Get the old question tags.
                const [oldTagRows] = await connection.query<any[]>(`
                    SELECT DISTINCT eqtr.tag_id AS tagId
                    FROM explorer_question_tag_rel eqtr
                             JOIN explorer_questions eq ON eq.id = eqtr.question_id
                    WHERE eq.recommended = 1
                      AND eqtr.question_id IN (
                        ${oldQuestionIds.map(() => `UUID_TO_BIN(?)`).join(',')}
                        )
                `, oldQuestionIds);
                oldTagIds = oldTagRows.map((row) => row.tagId);
                this.logger.info({questionId, hash, oldTagIds}, 'Get %d old question tags.', oldTagIds.length);

                // Unrecommended the old questions.
                const [rs] = await connection.query<ResultSetHeader>(`
                    UPDATE explorer_questions eq
                    SET recommended = 0
                    WHERE recommended = 1
                      AND eq.id IN (
                        ${oldQuestionIds.map(() => `UUID_TO_BIN(?)`).join(',')}
                        )
                `, oldQuestionIds);
                this.logger.info({questionId, hash}, 'Unrecommended the %d / %d old questions.', rs.affectedRows, oldQuestions.length);
            }

            // Recommended the new question.
            await connection.query(`
                UPDATE explorer_questions eq
                SET recommended = 1
                WHERE eq.id = UUID_TO_BIN(?)
            `, [questionId]);
            this.logger.info({questionId}, 'Recommended the new question.');

            // Migration the question tags.
            const questionTags = await this.getQuestionTags(questionId, connection);
            const existedTagIds = questionTags.map((qt) => qt.id);
            if (existedTagIds.length === 0 && oldTagIds.length > 0) {
                await this.setQuestionTags(questionId, oldTagIds, connection);
                this.logger.info({questionId, oldTagIds}, 'Migration the question tags.');
            }

            await connection.commit();
        } catch (err: any) {
            await connection.rollback();
            if (err instanceof ExplorerRecommendQuestionError) {
                throw err;
            } else {
                const message = `Failed to recommended question.`;
                this.logger.error({questionId, err}, message);
                throw new ExplorerRecommendQuestionError(500, message, err);
            }
        } finally {
            // @ts-ignore
            if (connection.release) {
                // @ts-ignore
                await connection.release();
            } else {
                await connection.end();
            }
        }
    }

    async cancelRecommendQuestion(questionId: string, conn?: Connection): Promise<void> {
        const connection = conn || await this.mysql.getConnection();

        try {
            const question = await this.getQuestionByIdOrError(questionId, connection);
            await connection.query(`
                UPDATE explorer_questions eq
                SET recommended = 0
                WHERE eq.id = UUID_TO_BIN(?)
            `, question.id);
        } catch (err: any) {
            if (err instanceof ExplorerCancelRecommendQuestionError) {
                throw err;
            } else {
                const message = `Failed to cancel recommended question.`;
                this.logger.error({questionId, err}, message);
                throw new ExplorerCancelRecommendQuestionError(500, message, err);
            }
        } finally {
            // @ts-ignore
            if (typeof connection.release) {
                // @ts-ignore
                await connection.release();
            } else {
                await connection.end();
            }
        }
    }

    async refreshRecommendQuestions(): Promise<void> {
        try {
            // TODO: remove the hard code 1000.
            const recommendQuestions = await this.getRecommendQuestionsByTag(1000);
            const batchJobId = randomUUID();
            const queue = async.queue<RecommendQuestion>((oldQuestion, callback) => {
                this.refreshRecommendQuestion(oldQuestion, batchJobId).then(() => {
                    callback();
                }).catch((err: any) => {
                    callback(err);
                });
            }, 3);

            await queue.push(recommendQuestions);
            await queue.drain();

            this.logger.info("Refresh %d recommended questions done.", recommendQuestions.length);
        } catch (err: any) {
            const message = `Failed to refresh recommended questions.`;
            this.logger.error({err}, message);
        }
    }

    async refreshRecommendQuestion(oldQuestion: RecommendQuestion, batchJobID: string): Promise<void> {
        try {
            const newQuestion = await withConnection(
              this.mysql,
              async conn => {
                  this.logger.info({ questionId: oldQuestion.questionId }, "Refresh recommended question: %s.", oldQuestion.title);
                  return await this.newQuestion(0, oldQuestion.title, true, true, true, batchJobID, conn);
              }
            )

            // Prepare question async.
            if (!newQuestion.hitCache) {
                try {
                    await this.prepareQuestion(newQuestion);
                } catch (err: any) {
                    this.logger.error(err, `Failed to prepare question ${newQuestion.id}: ${err.message}`);
                }
            }
        } catch (err: any) {
            const message = `Failed to refresh recommended question: ${oldQuestion.title}`;
            this.logger.error({questionId: oldQuestion.questionId, err}, message);
        }
    }

    // Question feedback.

    async addSystemQuestionFeedback(questionId: string, feedbackType: QuestionFeedbackType, feedbackContent?: string, conn?: Connection) {
        await this.addQuestionFeedback({
            userId: 0,
            questionId,
            satisfied: false,
            feedbackType,
            feedbackContent,
        }, conn);
    }

    async cancelUserQuestionFeedback(userId: number, questionId: string, satisfied: boolean, conn?: Connection) {
        const connection = conn || this.mysql;
        const [rs] = await connection.query<ResultSetHeader>(`
            DELETE FROM explorer_question_feedbacks
            WHERE question_id = UUID_TO_BIN(?) AND user_id = ? AND satisfied = ?
            LIMIT 1
        `, [questionId, userId, satisfied]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to cancel the question feedback.');
        }
    }

    async removeUserQuestionFeedbacks(userId: number, questionId: string, conn?: Connection) {
        const connection = conn || this.mysql;
        await connection.query<ResultSetHeader>(`
            DELETE FROM explorer_question_feedbacks
            WHERE user_id = ? AND question_id = UUID_TO_BIN(?)
        `, [userId, questionId]);
    }

    async getUserQuestionFeedbacks(userId: number, questionId: string, conn?: Connection): Promise<QuestionFeedback[]> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT
                id, user_id AS userId, BIN_TO_UUID(question_id) AS questionId, satisfied, feedback_type AS feedbackType,
                feedback_content AS feedbackContent, created_at AS createdAt
            FROM explorer_question_feedbacks
            WHERE user_id = ? AND question_id = UUID_TO_BIN(?)
        `, [userId, questionId]);
        return rows;
    }

    async addQuestionFeedback(feedback: Omit<QuestionFeedback, "id" | "createdAt">, conn?: Connection) {
        const connection = conn || this.mysql;
        const { userId = 0, questionId, satisfied = false, feedbackType, feedbackContent = null } = feedback;
        const [rs] = await connection.query<ResultSetHeader>(`
            INSERT INTO explorer_question_feedbacks(user_id, question_id, satisfied, feedback_type, feedback_content)
            VALUES (?, UUID_TO_BIN(?), ?, ?, ?)
        `, [userId, questionId, satisfied, feedbackType, feedbackContent]);
        if (rs.affectedRows !== 1) {
            throw new APIError(500, 'Failed to add the question feedback.');
        }
    }

    // Question answer summary.

    async generateAnswerSummaryByQuestionId(questionId: string): Promise<AnswerSummary> {
        const question = await this.getQuestionById(questionId);
        if (!question) {
            throw new APIError(404, 'Question not found.');
        }
        const { title, result } = question;
        if (!result || !Array.isArray(result.rows) || result.rows.length === 0) {
            throw new APIError(429, 'The question has no result.');
        }

        return this.generateAnswerSummary(questionId, title, result);
    }

    async generateAnswerSummary(questionId: string, title: string, result: QuestionSQLResult): Promise<AnswerSummary> {
        const summary = await this.botService.summaryAnswer(this.generateAnswerSummaryTemplate, title, result.rows);
        if (!summary) {
            throw new APIError(500, 'Failed to generate the answer summary.');
        }

        // Notice: Sometime AI will generate the summary content ends with hashtags, remove them.
        if (Array.isArray(summary.hashtags) && summary.hashtags.length > 0) {
            const hashtagsText = summary.hashtags.map((ht) => `#${ht}`).join(' ');
            summary.content = summary.content?.replace(hashtagsText, '');
        }

        await this.saveAnswerSummary(questionId, summary);
        return summary;
    }

    // Trusted users.
    async checkIfTrustedUser(userId: number, conn?: Connection): Promise<boolean> {
        const connection = conn || this.mysql;
        const [rows] = await connection.query<any[]>(`
            SELECT user_id AS userId FROM explorer_trusted_users
            WHERE user_id = ?
        `, [userId]);
        return rows.length > 0;
    }

    async checkIfTrustedUsersOrError(userId: number, conn?: Connection) {
        const isTrustedUser = await this.checkIfTrustedUser(userId, conn);
        if (!isTrustedUser) {
            throw new APIError(403, 'Has no permission to do this operation.');
        }
    }
}
