import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GID } from '@shopfabrik/shopify-data';
import { option, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import { graphql } from '../../client';
import type { ClientGraphqlPayload, PaginationConnection } from '../../client/graphql';
import type * as GQL from '../../schema.generated';
import {
  ScriptTagCreateDocument,
  ScriptTagCreateMutationVariables,
} from './scriptTagCreate.generated';
import { ScriptTagDeleteDocument } from './scriptTagDelete.generated';
import { ScriptTagsDocument, ScriptTagsQueryVariables } from './scriptTags.generated';
import {
  ScriptTagUpdateDocument,
  ScriptTagUpdateMutationVariables,
} from './scriptTagUpdate.generated';

export type ConnectionInput<A extends Partial<GQL.ScriptTag>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: ScriptTagsQueryVariables;
};

export function connection<A extends Partial<GQL.ScriptTag>>(
  input: ConnectionInput<A>,
): ClientGraphqlPayload<PaginationConnection<A>> {
  return (env) => {
    return pipe(
      env.shopify.client.graphql.query({
        query: ScriptTagsDocument(input.fragment),
        variables: input.variables,
      }),
      taskEither.map((query) => query.scriptTags),
    );
  };
}

export type CreateInput<A extends Partial<GQL.ScriptTag>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: ScriptTagCreateMutationVariables;
};

export function create<A extends Partial<GQL.ScriptTag>>(
  input: CreateInput<A>,
): ClientGraphqlPayload<A> {
  const config = {
    mutation: ScriptTagCreateDocument(input.fragment),
    variables: input.variables,
  };

  return (env) => {
    return pipe(
      env.shopify.client.graphql.mutate(config),
      taskEither.chainEitherK(
        graphql.error.handleUserErrors(
          config,
          (response) => response.scriptTagCreate?.userErrors,
          (response) => response.scriptTagCreate?.scriptTag,
        ),
      ),
    );
  };
}

export type UpdateInput<A extends Partial<GQL.ScriptTag>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: ScriptTagUpdateMutationVariables;
};

export function update<A extends Partial<GQL.ScriptTag>>(
  input: UpdateInput<A>,
): ClientGraphqlPayload<A> {
  const config = {
    mutation: ScriptTagUpdateDocument(input.fragment),
    variables: input.variables,
  };

  return (env) => {
    return pipe(
      env.shopify.client.graphql.mutate(config),
      taskEither.chainEitherK(
        graphql.error.handleUserErrors(
          config,
          (response) => response.scriptTagUpdate?.userErrors,
          (response) => response.scriptTagUpdate?.scriptTag,
        ),
      ),
    );
  };
}

export function remove(id: GID): ClientGraphqlPayload<Option<GID>> {
  return (env) => {
    return pipe(
      env.shopify.client.graphql.mutate({
        mutation: ScriptTagDeleteDocument,
        variables: {
          id,
        },
      }),
      taskEither.map((mutation) =>
        option.fromNullable(mutation.scriptTagDelete?.deletedScriptTagId),
      ),
    );
  };
}
