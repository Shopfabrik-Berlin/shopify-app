import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { ClientGraphqlPayload } from '../../client';
import type * as GQL from '../../schema.generated';
import { ShopDocument } from './shop.generated';

export type GetInput<A extends Partial<GQL.Shop>> = {
  fragment: TypedDocumentNode<A>;
};

export function get<A extends Partial<GQL.Shop>>(input: GetInput<A>): ClientGraphqlPayload<A> {
  return (env) => {
    return pipe(
      env.shopify.client.graphql.query({
        query: ShopDocument(input.fragment),
        variables: {},
      }),
      taskEither.map((query) => query.shop),
    );
  };
}
