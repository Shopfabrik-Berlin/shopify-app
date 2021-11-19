import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { ReadonlyRecord } from '../../types';

export type GraphQLRequestConfig<
  A extends ReadonlyRecord = ReadonlyRecord,
  I extends ReadonlyRecord = ReadonlyRecord,
> = MutateConfig<A, I> | QueryConfig<A, I>;

export type MutateConfig<
  A extends ReadonlyRecord = ReadonlyRecord,
  I extends ReadonlyRecord = ReadonlyRecord,
> = {
  readonly mutation: TypedDocumentNode<A, I>;
  readonly variables: I;
};

export type QueryConfig<
  A extends ReadonlyRecord = ReadonlyRecord,
  I extends ReadonlyRecord = ReadonlyRecord,
> = {
  readonly query: TypedDocumentNode<A, I>;
  readonly variables: I;
};
