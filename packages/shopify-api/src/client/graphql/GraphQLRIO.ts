import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { rio } from '../../utils';
import { getClient, GraphQLClientEnv } from './graphql';
import { handleUserErrors, UnhandledUserError } from './GraphQLResponseError';

export type GraphQLRIO<O, I> = rio.RIOP<GraphQLClientEnv, I, O>;

export function fromDocument<O, I>(document: TypedDocumentNode<O, I>): GraphQLRIO<O, I> {
  return (env, input) => {
    return getClient(env).request({
      document,
      variables: input,
    });
  };
}

export function fromDocumentWithUserErrors<O1, I, O2>(
  document: TypedDocumentNode<O1, I>,
  getErrors: (result: O1) => readonly UnhandledUserError[] | null | undefined,
  getResult: (result: O1) => O2 | null | undefined,
): GraphQLRIO<O2, I> {
  const rio = fromDocument(document);

  return async (env, input) => {
    const result = await rio(env, input);
    return handleUserErrors(
      {
        document,
        variables: input,
      },
      getErrors(result),
      getResult(result),
    );
  };
}
