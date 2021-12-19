import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GID } from '@shopfabrik/shopify-data';
import { apply, option, readerTaskEither, readonlyArray } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import { ClientGraphqlPayload, graphql } from '../../../client';
import * as scriptTag from '../ScriptTag';
import { ScriptTagSyncFragment, ScriptTagSyncFragmentDoc } from './ScriptTagSync.generated';

export type { ScriptTagSyncFragment };

export type SyncMinimalInput = SyncVariables;

export type SyncMinimalPayload = SyncPayload<ScriptTagSyncFragment>;

export function syncMinimal(input: SyncMinimalInput): ClientGraphqlPayload<SyncMinimalPayload> {
  return sync({
    fragment: ScriptTagSyncFragmentDoc,
    variables: input,
  });
}

export type SyncInput<A extends ScriptTagSyncFragment> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: SyncVariables;
};

export type SyncVariables = {
  readonly scriptTags: ReadonlyArray<SyncVariablesScriptTag>;
  readonly limit: number;
};

export type SyncVariablesScriptTag = Pick<ScriptTagSyncFragment, 'cache' | 'displayScope' | 'src'>;

export type SyncPayload<A extends ScriptTagSyncFragment> = {
  readonly deletedScriptTagIds: ReadonlyArray<GID>;
  readonly scriptTags: ReadonlyArray<A>;
};

export function sync<A extends ScriptTagSyncFragment>(
  input: SyncInput<A>,
): ClientGraphqlPayload<SyncPayload<A>> {
  return pipe(
    scriptTag.connection({
      fragment: input.fragment,
      variables: {
        first: input.variables.limit,
      },
    }),

    readerTaskEither.chain((connection) => {
      const { existingScriptTags: extraScriptTags, scriptTags } = input.variables.scriptTags.reduce(
        findOrCreateScriptTag(input.fragment),
        {
          existingScriptTags: graphql.pagination.nodesFromConnection(connection),
          scriptTags: [],
        },
      );

      return apply.sequenceS(readerTaskEither.ApplyPar)({
        deletedScriptTagIds: pipe(
          extraScriptTags,
          readerTaskEither.traverseArray((extraScriptTag) => scriptTag.remove(extraScriptTag.id)),
          readerTaskEither.map(readonlyArray.compact),
        ),
        scriptTags: readerTaskEither.sequenceArray(scriptTags),
      });
    }),
  );
}

type ScriptTagAccumulator<A extends ScriptTagSyncFragment> = {
  readonly existingScriptTags: ReadonlyArray<A>;
  readonly scriptTags: ReadonlyArray<ClientGraphqlPayload<A>>;
};

function findOrCreateScriptTag<A extends ScriptTagSyncFragment>(fragment: TypedDocumentNode<A>) {
  return (acc: ScriptTagAccumulator<A>, input: SyncVariablesScriptTag): ScriptTagAccumulator<A> => {
    return pipe(
      acc.existingScriptTags,

      readonlyArray.findFirst(
        (existingScriptTag) =>
          existingScriptTag.cache === input.cache &&
          existingScriptTag.displayScope === input.displayScope &&
          existingScriptTag.src === input.src,
      ),

      option.fold(
        () => {
          return {
            existingScriptTags: acc.existingScriptTags,
            scriptTags: [
              ...acc.scriptTags,
              scriptTag.create({
                fragment,
                variables: {
                  input,
                },
              }),
            ],
          };
        },

        (existingScriptTag) => {
          return {
            existingScriptTags: acc.existingScriptTags.filter(
              (_existingScriptTag) => _existingScriptTag !== existingScriptTag,
            ),
            scriptTags: [...acc.scriptTags, readerTaskEither.of(existingScriptTag)],
          };
        },
      ),
    );
  };
}
