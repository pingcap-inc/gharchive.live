import * as React from 'react';
import { MouseEventHandler, useEffect, useMemo, useState } from 'react';
import { format } from 'sql-formatter';
import { Button, createTheme, Drawer, Grow, Tooltip, useEventCallback } from '@mui/material';
import { isNonemptyString, isNullish } from '@site/src/utils/value';
import LoadingButton from '@mui/lab/LoadingButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAnalyzeContext } from '../charts/context';
import SQLEditor from './SQLEditor';
import { PredefinedQuestion } from './predefined';
import PredefinedGroups from './PredefinedGroups';
import { Gap, PlaygroundBody, PlaygroundButton, PlaygroundButtonContainer, PlaygroundContainer, PlaygroundDescription, PlaygroundHeadline, PlaygroundMain, PlaygroundPopoverContent, PlaygroundSide, QuestionFieldTitle } from './styled';
import { Experimental, useExperimental } from '@site/src/components/Experimental';
import { aiQuestion } from '@site/src/api/core';
import ResultBlock from './ResultBlock';
import QuestionField from './QuestionField';
import { useAsyncOperation } from '@site/src/hooks/operation';
import { core } from '@site/src/api';
import { LoginRequired } from '@site/src/components/LoginRequired';
import { HelpOutline } from '@mui/icons-material';
import useUrlSearchState, { booleanParam } from '@site/src/hooks/url-search-state';
import { useWhenMounted } from '@site/src/hooks/mounted';
import { useTimeout } from 'ahooks';
import ThemeProvider from '@mui/system/ThemeProvider';

const DEFAULT_QUESTION = 'Who closed the last issue in this repo?';
const QUESTION_MAX_LENGTH = 200;

function Playground ({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { repoName, repoId } = useAnalyzeContext();

  const [inputValue, setInputValue] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<PredefinedQuestion>();
  const [customQuestion, setCustomQuestion] = useState('');

  const setCustomQuestionWithMaxLength = useEventCallback((value: string) => {
    setCustomQuestion(oldValue => value.length <= QUESTION_MAX_LENGTH ? value : oldValue);
  });

  const { data, loading, error, run } = useAsyncOperation({ sql: inputValue, type: 'repo', id: `${repoId ?? 'undefined'}` }, core.postPlaygroundSQL);
  const { data: questionSql, loading: questionLoading, error: questionError, run: runQuestion } = useAsyncOperation({ question: customQuestion || DEFAULT_QUESTION, context: { repo_id: repoId, repo_name: repoName } }, aiQuestion);

  const onChange = (newValue: string) => {
    setInputValue(newValue);
    setCurrentQuestion(undefined);
  };

  const handleFormatSQLClick = () => {
    const formattedSQL = format(inputValue, {
      language: 'mysql',
      uppercase: true,
      linesBetweenQueries: 2,
    });
    setInputValue(formattedSQL);
  };

  const handleSelectQuestion = useEventCallback((question: PredefinedQuestion) => {
    const trueSql = [
      { match: 'repoId', value: `${repoId ?? 'undefined'}` },
      { match: 'repoName', value: repoName ?? 'undefined' },
    ].reduce((sql, { match, value }) => sql.replaceAll(`{{${match}}}`, value), question.sql);
    setInputValue(trueSql);
    setCurrentQuestion(question);
  });

  useEffect(() => {
    if (isNonemptyString(questionSql)) {
      setInputValue(format(questionSql, {
        language: 'mysql',
        uppercase: true,
        linesBetweenQueries: 2,
      }));
    }
  }, [questionSql]);

  const defaultInput = useMemo(() => {
    return `
/* ⚠️ 
Playground uses LIMITED resource(cpu/mem), so SQL should add:

WHERE repo_id = ${repoId ?? 'undefined'}

to use index as much as possible, or it will be terminated.


Example:

SELECT
*
FROM
github_events
WHERE
repo_id = ${repoId ?? '{{repoId}}'}
LIMIT
1;
*/
`;
  }, [repoId]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <PlaygroundContainer id="sql-playground-container">
        <PlaygroundBody>
          <PlaygroundSide>
            <PlaygroundHeadline>
              Playground: Customize your queries with SQL
              <Experimental feature="ai-playground">
                <> or AI<span className="opaque">🤖</span>️</>
              </Experimental>
              !
            </PlaygroundHeadline>
            <PlaygroundDescription>
              <li>Choose a question<Experimental feature="ai-playground"><> or create a new one</>
              </Experimental> below
              </li>
              <li>Check or edit the generated SQL（Optional）</li>
              <li>Run your SQL and enjoy your results</li>
            </PlaygroundDescription>
            <Experimental feature="ai-playground">
              <>
                <QuestionFieldTitle>
                  Your Question
                  <Tooltip title="The result SQL will be generated by AI.">
                    <HelpOutline sx={{ ml: 1 }} fontSize="inherit" />
                  </Tooltip>
                </QuestionFieldTitle>
                <LoginRequired promote="Log in to write question" sx={{ mt: 1 }}>
                  <QuestionField
                    loading={questionLoading}
                    error={questionError}
                    value={customQuestion}
                    onChange={setCustomQuestionWithMaxLength}
                    onAction={runQuestion}
                    defaultQuestion={DEFAULT_QUESTION}
                    maxLength={QUESTION_MAX_LENGTH}
                  />
                </LoginRequired>
              </>
            </Experimental>
            <PredefinedGroups onSelectQuestion={handleSelectQuestion} question={currentQuestion} />
          </PlaygroundSide>
          <PlaygroundMain>
            <SQLEditor
              loading={questionLoading || loading}
              mode="sql"
              theme="twilight"
              onChange={onChange}
              name="SQL_PLAYGROUND"
              showPrintMargin={false}
              value={inputValue || defaultInput}
              fontSize={16}
              setOptions={{
                enableLiveAutocompletion: true,
              }}
              extra={
                <>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!inputValue || isNullish(repoId)}
                    onClick={handleFormatSQLClick}
                  >
                    Format
                  </Button>
                  <LoadingButton
                    variant="contained"
                    size="small"
                    disabled={!inputValue || isNullish(repoId)}
                    onClick={run}
                    endIcon={<PlayArrowIcon fontSize="inherit" />}
                    loading={loading}
                  >
                    Run
                  </LoadingButton>
                </>
              }
            />
            <Gap />
            <ResultBlock data={data} loading={loading} error={error} />
          </PlaygroundMain>
        </PlaygroundBody>
      </PlaygroundContainer>
    </Drawer>
  );
}

const DISPLAY_POPPER_TIMEOUT = process.env.NODE_ENV === 'development' ? 1000 : 5000;

export function usePlayground () {
  const [open, setOpen] = useUrlSearchState('playground', booleanParam('enabled'), false);
  const [popoverIn, setPopoverIn] = useState(false);
  const whenMounted = useWhenMounted();
  const [aiEnabled] = useExperimental('ai-playground');

  const handleClose = useEventCallback(whenMounted(() => {
    setOpen(false);
  }));

  const handleClickTerminalBtn = useEventCallback(whenMounted((event: React.MouseEvent<HTMLElement>) => {
    setOpen(open => !open);
    setPopoverIn(shown => {
      if (aiEnabled && shown) {
        localStorage.setItem('ossinsight.playground.tooltip-closed', 'true');
      }
      return false;
    });
  }));

  const clearTimeout = useTimeout(whenMounted(() => {
    setPopoverIn(true);
  }), DISPLAY_POPPER_TIMEOUT);

  useEffect(() => {
    if (localStorage.getItem('ossinsight.playground.tooltip-closed') === 'true') {
      clearTimeout();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toUpperCase() === 'K' && (event.ctrlKey || event.metaKey)) {
        // it was Ctrl + K (Cmd + K)
        setOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const button = useMemo(() => (
    <PlaygroundButtonContainer className={open ? 'opened' : ''}>
      <Experimental feature="ai-playground">
        <Grow in={popoverIn}>
          <div>
            <PlaygroundPopover onClickButton={handleClickTerminalBtn} />
          </div>
        </Grow>
      </Experimental>
      <PlaygroundButton
        className={`${open ? '' : 'tada animated'}`}
        aria-label="Open SQL Playground"
        onClick={handleClickTerminalBtn}
        disableRipple
        disableTouchRipple
      >
        <img src={require('./icon.png').default} width="66" height="73" alt="Playground icon" />
      </PlaygroundButton>
    </PlaygroundButtonContainer>
  ), [popoverIn, open]);

  const drawer = useMemo(() => (
    <Playground open={open} onClose={handleClose} />
  ), [open]);

  return { button, drawer };
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FFE895',
      contrastText: '#1C1E21',
    },
  },
});

function PlaygroundPopover ({ onClickButton }: { onClickButton: MouseEventHandler }) {
  return (
    <ThemeProvider theme={theme}>
      <PlaygroundPopoverContent>
        <h2>👀 Want to know more about this repo?</h2>
        <p>Chat with GitHub data directly and gain your own insights here!</p>
        <Button fullWidth size="small" variant="contained" onClick={onClickButton}>Ask me a question</Button>
      </PlaygroundPopoverContent>
    </ThemeProvider>
  );
};
