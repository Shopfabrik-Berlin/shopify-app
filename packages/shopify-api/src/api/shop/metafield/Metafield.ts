import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { option, readerTaskEither, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import type { ClientGraphqlPayload } from '../../../client';
import type * as GQL from '../../../schema.generated';
import * as metafield from '../../metafield';
import * as shop from '../Shop';
import { ShopFragmentDoc } from '../ShopId.generated';
import { ShopMetafieldDocument, ShopMetafieldQueryVariables } from './shopMetafield.generated';

export type FindInput<A extends Partial<GQL.Metafield>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: ShopMetafieldQueryVariables;
};

export function find<A extends Partial<GQL.Metafield>>(
  input: FindInput<A>,
): ClientGraphqlPayload<Option<A>> {
  return (env) => {
    return pipe(
      env.shopify.client.graphql.query({
        query: ShopMetafieldDocument(input.fragment),
        variables: input.variables,
      }),
      taskEither.map((query) => option.fromNullable(query.shop.metafield)),
    );
  };
}

export type SetInput<A extends Partial<GQL.Metafield>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: {
    readonly metafields: ReadonlyArray<SetInputMetafield>;
  };
};

export type SetInputMetafield = Pick<
  GQL.MetafieldsSetInput,
  'key' | 'namespace' | 'type' | 'value'
>;

export function set<A extends Partial<GQL.Metafield>>(
  input: SetInput<A>,
): ClientGraphqlPayload<ReadonlyArray<A>> {
  return pipe(
    shop.get({ fragment: ShopFragmentDoc }),

    readerTaskEither.chain((shop) => {
      return metafield.set({
        fragment: input.fragment,
        variables: {
          metafields: input.variables.metafields.map((metafield) => ({
            ...metafield,
            ownerId: shop.id,
          })),
        },
      });
    }),
  );
}
