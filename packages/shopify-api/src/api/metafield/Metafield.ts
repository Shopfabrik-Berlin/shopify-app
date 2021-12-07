import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GID } from '@shopfabrik/shopify-data';
import { option, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import { ClientGraphqlPayload, graphql } from '../../client';
import type * as GQL from '../../schema.generated';
import { MetafieldDeleteDocument } from './metafieldDelete.generated';
import { MetafieldsSetDocument, MetafieldsSetMutationVariables } from './metafieldsSet.generated';

export type SetInput<A extends Partial<GQL.Metafield>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: MetafieldsSetMutationVariables;
};

export function set<A extends Partial<GQL.Metafield>>(
  input: SetInput<A>,
): ClientGraphqlPayload<ReadonlyArray<A>> {
  const config = {
    mutation: MetafieldsSetDocument(input.fragment),
    variables: input.variables,
  };

  return (env) => {
    return pipe(
      env.shopify.client.graphql.mutate(config),
      taskEither.chainEitherK(
        graphql.error.handleUserErrors(
          config,
          (response) => response.metafieldsSet?.userErrors,
          (response) => response.metafieldsSet?.metafields,
        ),
      ),
    );
  };
}

export function remove(id: GID): ClientGraphqlPayload<Option<GID>> {
  return (env) => {
    return pipe(
      env.shopify.client.graphql.mutate({
        mutation: MetafieldDeleteDocument,
        variables: {
          input: {
            id,
          },
        },
      }),
      taskEither.map((mutation) => option.fromNullable(mutation.metafieldDelete?.deletedId)),
    );
  };
}
