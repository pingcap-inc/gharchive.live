import {Command} from "commander";
import {logger} from "@logger";
import {
  listCollections,
  listAllCollections
} from "@db/collections";
import {loadCollectionConfigs} from "@configs";
import * as process from "node:process";
import {findReposByNames} from "@db/github_repos";
import {booleanParser, DEFAULT_COLLECTION_CONFIGS_BASE_DIR, stringParser} from "@cmd/collection/common";

export function initVerifyCollectionCommand(collectionCmd: Command) {
  collectionCmd
    .command('verify')
    .description('Verify collection configs.')
    .option<string>(
      '-d, --base-dir <path>',
      'The base directory stored the collection config',
      stringParser,
      DEFAULT_COLLECTION_CONFIGS_BASE_DIR
    )
    .option<boolean>(
      '-f, --fast-fail',
      'whether to use fast fail mode',
      booleanParser,
      true
    )
    .action(verifyCollectionConfigs);
}

export async function verifyCollectionConfigs(args: any) {
  try {
    const { baseDir, fastFail } = args;

    const configsMap = await loadCollectionConfigs(baseDir);
    logger.info(`Loaded ${configsMap.size} collections from config files in the directory ${baseDir}.`);

    const collections = await listCollections();
    logger.info(`Loaded ${collections.length} collections from database.`);

    const oldCollectionIds = new Set(collections.map((c) => c.id));
    const newCollectionIds = new Set(configsMap.keys());

    // Notice: All collections include the archived collections, which were marked as deleted with deleted_at field.
    const allCollections = await listAllCollections();
    const existsCollectionIds = new Set(allCollections.map((c) => c.id));
    const existsCollectionNames = new Set(allCollections.map((c) => c.name));

    const errors: Error[] = [];
    const throwError = fastFail ?
      (err: Error) => { throw err; } :
      (err: Error) => { errors.push(err); };

    for (const config of configsMap.values()) {
      const { id: collectionId, name: collectionName, items: collectionRepos } = config;
      logger.debug(`Checking collection [${collectionName}](id: ${collectionId}) ...`)

      // Check if the new collection configs is valid.
      if (!oldCollectionIds.has(collectionId) && newCollectionIds.has(collectionId)) {
        if (existsCollectionIds.has(collectionId)) {
          throwError(new Error(`Collection [${collectionName}]: collection id ${collectionId} has been allocated, please consider using another one instead.`));
        }
        if (existsCollectionNames.has(collectionName)) {
          throwError(new Error(`Collection [${collectionName}]: collection name ${collectionName} has been allocated, please consider using another one instead.`));
        }
      }

      // Check if the repos in the collection is all existed.
      const repos = await findReposByNames(collectionRepos);
      if (repos.length < collectionRepos.length) {
        const diffRepos = collectionRepos.filter(name => !repos.some(r => r.repo_name === name));

        throwError(new Error(`Collection [${collectionName}](id: ${collectionId}): can not find some repos by names: ${diffRepos.join(', ')}`));
      }

      logger.info(`✅  Checked collection [${collectionName}](id: ${collectionId}).`)
    }

    // Without fast fail mode, when an error is encountered, it will continue to run until all checks are completed
    // and then output all errors together.
    if (errors.length > 0) {
      logger.error(`❌  Failed to verify collection configs, please check error messages as follows and modify the configs：`);
      for (let error of errors) {
        logger.error(error.message);
      }
      process.exit(-1);
    }

    process.exit(0);
  } catch (e: any) {
    logger.error(e, `❌  Failed to verify collection configs, please check the configs.`);
    process.exit(-1);
  }
}