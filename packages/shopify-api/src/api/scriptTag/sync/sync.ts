import type { GID } from '@shopfabrik/shopify-data';
import { graphql } from '../../../client';
import { nullish, rio } from '../../../utils';
import {
  ScriptTagCreateDocument,
  ScriptTagDeleteDocument,
  ScriptTagsDocument,
  ScriptTagSyncFragment,
} from './sync.generated';

export type { ScriptTagSyncFragment };

export type Sync = rio.p.TypeFn<typeof sync>;

type SyncInput = {
  scriptTags: readonly SyncVariablesScriptTag[];
  limit: number;
};

type SyncPayload = {
  deletedScriptTagIds: readonly GID[];
  scriptTags: readonly ScriptTagSyncFragment[];
};

type SyncVariablesScriptTag = Pick<ScriptTagSyncFragment, 'cache' | 'displayScope' | 'src'>;

const createScriptTag = graphql.rio.fromDocumentWithUserErrors(
  ScriptTagCreateDocument,
  (data) => data.scriptTagCreate?.userErrors,
  (data) => data.scriptTagCreate?.scriptTag,
);

const listScriptTags = rio.p.map(graphql.rio.fromDocument(ScriptTagsDocument), (data) =>
  graphql.pagination.nodesFromConnection(data.scriptTags),
);

const removeScriptTag = rio.p.map(
  graphql.rio.fromDocument(ScriptTagDeleteDocument),
  (data) => data.scriptTagDelete?.deletedScriptTagId,
);

export const sync = rio.mapEnv(
  _sync,
  rio.sequenceEnv({
    createScriptTag,
    listScriptTags,
    removeScriptTag,
  }),
);

export type _Sync = rio.p.TypeFn<typeof _sync>;

type _SyncEnv = rio.RemoveEnvS<{
  createScriptTag: typeof createScriptTag;
  listScriptTags: typeof listScriptTags;
  removeScriptTag: typeof removeScriptTag;
}>;

export async function _sync(env: _SyncEnv, input: SyncInput): Promise<SyncPayload> {
  const existingScriptTags = await env.listScriptTags({ first: input.limit });

  const { existingScriptTags: scriptTagsToDelete, scriptTags: scriptTagsToKeep } =
    input.scriptTags.reduce(findOrCreateScriptTag(env), {
      existingScriptTags,
      scriptTags: [],
    });

  const deleteScriptTagsTask = Promise.all(
    scriptTagsToDelete.map((scriptTag) => env.removeScriptTag({ id: scriptTag.id })),
  );

  const [deletedScriptTagIds, scriptTags] = await Promise.all([
    deleteScriptTagsTask,
    Promise.all(scriptTagsToKeep),
  ]);

  return {
    deletedScriptTagIds: deletedScriptTagIds.filter(nullish.isNot),
    scriptTags,
  };
}

type FindOrCreateScriptTagEnv = rio.RemoveEnvS<{
  createScriptTag: typeof createScriptTag;
}>;

type ScriptTagAccumulator = {
  existingScriptTags: readonly ScriptTagSyncFragment[];
  scriptTags: readonly Promise<ScriptTagSyncFragment>[];
};

function findOrCreateScriptTag(env: FindOrCreateScriptTagEnv) {
  return (acc: ScriptTagAccumulator, input: SyncVariablesScriptTag): ScriptTagAccumulator => {
    const existingScriptTag = acc.existingScriptTags.find(
      (existingScriptTag) =>
        existingScriptTag.cache === input.cache &&
        existingScriptTag.displayScope === input.displayScope &&
        existingScriptTag.src === input.src,
    );

    if (!existingScriptTag) {
      const createScriptTag = env.createScriptTag({ input });

      return {
        existingScriptTags: acc.existingScriptTags,
        scriptTags: [...acc.scriptTags, createScriptTag],
      };
    }

    return {
      existingScriptTags: acc.existingScriptTags.filter(
        (_existingScriptTag) => _existingScriptTag !== existingScriptTag,
      ),
      scriptTags: [...acc.scriptTags, Promise.resolve(existingScriptTag)],
    };
  };
}
