import {Command} from "commander";
import {logger} from "@logger";
import {
  deleteCollections,
  listCollectionItems,
  listCollections,
  removeCollectionItems,
  updateCollection, addCollectionItems, insertCollection
} from "@db/collections";
import {loadCollectionConfigs} from "@configs";
import * as process from "node:process";
import {findReposByNames} from "@db/github_repos";
import {DEFAULT_COLLECTION_CONFIGS_BASE_DIR, stringParser} from "@cmd/collection/common";

export function initReloadCollectionCommand(collectionCmd: Command) {
  collectionCmd
    .command('reload')
    .description('Reload collection from specified directory.')
    .option<string>(
      '-d, --base-dir <path>',
      'The base directory stored the collection config.',
      stringParser,
      DEFAULT_COLLECTION_CONFIGS_BASE_DIR
    )
    .action(syncCollection);
}

export async function syncCollection(args: any) {
  try {
    const { baseDir } = args;

    const configsMap = await loadCollectionConfigs(baseDir);
    logger.info(`Loaded ${configsMap.size} collections from config files in the directory ${baseDir}.`);

    const collections = await listCollections();
    logger.info(`Loaded ${collections.length} collections from database.`);

    const oldCollectionIds = new Set(collections.map((c) => c.id));
    const newCollectionIds = new Set(configsMap.keys());
    const collectionIdsToDelete = Array.from(oldCollectionIds.difference(newCollectionIds));

    // Remove non-exists collections from database.
    if (collectionIdsToDelete.length > 0) {
      const deleteResult = await deleteCollections(collectionIdsToDelete);
      logger.info(deleteResult, `Collections ${collectionIdsToDelete.join(', ')} have been removed from config files, delete them from database.`);
    }

    // Travel collection configs, add or update collections to database.
    for (const config of configsMap.values()) {
      const { id: collectionId, name: collectionName, items: collectionRepos } = config;

      if (!newCollectionIds.has(collectionId)) {
        // Add new collection from config to database.
        await insertCollection({
          id: collectionId,
          name: collectionName,
        });
        logger.info(`✅ Collection [${collectionName}] (id: ${collectionId}) is newly added to config file, inserted it.`);
      } else {
        // Update exists collection from config to database.
        const result = await updateCollection({
          id: collectionId,
          name: collectionName,
        });

        if (result.numChangedRows === 1n) {
          logger.info(`✅ Collection [${collectionName}](id: ${collectionId}) is existed but changed, updated it.`);
        } else {
          logger.info(`⏭️ Collection [${collectionName}](id: ${collectionId}) is existed but not changed, skipped it.`);
        }
      }

      // Sync collection items.
      await syncCollectionItems(collectionId, collectionName, collectionRepos);
    }

    process.exit(0);
  } catch (e: any) {
    logger.error(e, `❌  Failed to reload collection configs.`);
    process.exit(1);
  }
}

export async function syncCollectionItems(collectionId: number, collectionName: string, collectionRepos: string[]) {
  // Fetched exists collection items.
  const collectionItems = await listCollectionItems(collectionId);
  const oldRepoNames = new Set(collectionItems.map((i) => i.repo_name));
  const newRepoNames = new Set(collectionRepos);

  // Remove non-exists items from collection.
  const reposToRemove = oldRepoNames.difference(newRepoNames);
  if (reposToRemove.size > 0) {
    const repoNames = Array.from(reposToRemove);
    await removeCollectionItems(collectionId, repoNames);
    logger.info(`✅ Collection [${collectionName}] (id: ${collectionId}): repos ${repoNames.join(',')} has been removed from collection [${collectionName}](id: ${collectionId}).`);
  }

  // Add collection items.
  const reposToAdd = newRepoNames.difference(oldRepoNames);
  if (reposToAdd.size === 0) {
    logger.debug(`Collection [${collectionName}](id: ${collectionId}) has no new repos, skipped.`)
    return;
  }

  const repoNames = Array.from(reposToAdd.keys());
  const repos = await findReposByNames(repoNames);
  if (repos.length < reposToAdd.size) {
    const diffRepos = repoNames.filter(name => !repos.some(r => r.repo_name === name));
    throw new Error(`Collection [${collectionName}] (id: ${collectionId}): can not find some repos by names: ${diffRepos.join(', ')}`)
  }

  await addCollectionItems(collectionId, repos);
  logger.info(`✅ Collection [${collectionName}] (id: ${collectionId}): add repos ${repoNames.join(',')} to collection [${collectionName}] (id: ${collectionId}).`);
}
