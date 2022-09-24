import {readFile} from 'fs/promises'
import path from 'path'
import {DateTime, Duration} from "luxon";
import type { QuerySchema } from '../../params.schema'
import {TiDBQueryExecutor, Rows, Fields} from "./TiDBQueryExecutor";
import {CachedData} from "./cache/Cache";
import consola from "consola";
import {dataQueryTimer, measure, readConfigTimer} from "../metrics";
import GHEventService from "../services/GHEventService";
import CollectionService from '../services/CollectionService';
import CacheBuilder from './cache/CacheBuilder';
import { QueryTemplateNotFoundError } from './QueryFactory';
import UserService from '../services/UserService';
import { PoolConnection, QueryOptions } from 'mysql2/promise';
import { buildParams } from './QueryParam';

const logger = consola.withTag('query');

export type ExtendQueryOptions = Partial<QueryOptions>;

export default class Query {

  public readonly path: string;
  private template: string | undefined = undefined;
  private queryDef: QuerySchema | undefined = undefined;
  private readonly loadingPromise: Promise<boolean>

  constructor(
    public readonly name: string,
    public readonly cacheBuilder: CacheBuilder,
    public readonly queryExecutor: TiDBQueryExecutor,
    public readonly ghEventService: GHEventService,
    public readonly collectionService: CollectionService,
    public readonly userService: UserService,
    public readonly conn?: PoolConnection | null,
  ) {
    this.path = path.join(process.cwd(), 'queries', name)
    const templateFilePath = path.join(this.path, 'template.sql')
    const paramsFilePath = path.join(this.path, 'params.json')

    this.loadingPromise = new Promise<boolean>(async (resolve, reject) => {
      try {
        await measure(readConfigTimer.labels({ type: 'template.sql' }), async () => {
          this.template = await readFile(templateFilePath, {encoding: "utf-8"})
        })
        await measure(readConfigTimer.labels({ type: 'params.json' }), async () => {
          this.queryDef = JSON.parse(await readFile(paramsFilePath, {encoding: 'utf-8'})) as QuerySchema
        })
        resolve(true)
      } catch (err) {
        logger.log('Failed to load query template file: ', err)
        reject(new QueryTemplateNotFoundError('Failed to load query template file.'))
      }
    })
  }

  ready(): Promise<boolean> {
    return this.loadingPromise
  }

  async getSql(params: Record<string, any>): Promise<string> {
    return buildParams(this.template!, this.queryDef!, params, this.ghEventService, this.collectionService, this.userService)
  }

  async execute <T> (params: Record<string, any>, refreshCache: boolean = false, ip?: string, options?: ExtendQueryOptions): Promise<CachedData<T>> {
    return this.run('query', refreshCache, false, false, params, ip, options);
  }

  async explain <T> (params: Record<string, any>, refreshCache: boolean = false, ip?: string, options?: ExtendQueryOptions): Promise<CachedData<T>> {
    return this.run('explain', refreshCache, true, true, params, ip, options);
  }

  private async run <T> (
    prefix: string,
    refreshCache: boolean = false,
    ignoreCache: boolean = false,
    ignoreOnlyFromCache: boolean = false,
    params: Record<string, any>,
    ip?: string,
    options?: ExtendQueryOptions,
  ): Promise<CachedData<T>> {
    await this.ready();

    const { cacheHours = -1, onlyFromCache = false, cacheProvider } = this.queryDef!;
    const queryName = this.queryDef!.name || this.name;
    const queryKey = `${prefix}:${queryName}`;
    const cacheKey = this.getQueryKey(prefix, queryName, this.queryDef!, params);
    const cache = this.cacheBuilder.build(
      cacheProvider,
      cacheKey,
      ignoreCache ? 0 : cacheHours,
      ignoreOnlyFromCache ? false : onlyFromCache,
      refreshCache
    );

    return cache.load(async () => {
      return await measure(dataQueryTimer, async () => {
        const sql = await this.getSql(params);

        try {
          const start = DateTime.now();
          let rows: Rows, fields: Fields;
          if (this.conn) {
            [rows, fields] = await this.queryExecutor.executeWithConn(this.conn, queryKey, {
              sql: sql,
              ...options
            });
          } else {
            [rows, fields] = await this.queryExecutor.execute(queryKey, {
              sql: sql,
              ...options
            });
          }
          const end = DateTime.now();

          return {
            params: params,
            requestedAt: start,
            finishedAt: end,
            spent: end.diff(start).as('seconds'),
            sql,
            fields: fields,
            data: rows,
          }
        } catch (e: any) {
          e.sql = sql
          throw e
        }
      })
    }, ip)
  }

  private getQueryKey(prefix: string, queryName: string, queryDef: QuerySchema, params: Record<string, any>): string {
    return `${prefix}:${queryName}:${queryDef!.params.map(p => params[p.name]).join('_')}`;
  }
}

export function needPrefetch(queryDef: QuerySchema) {
  return queryDef.refreshCron !== undefined;
}