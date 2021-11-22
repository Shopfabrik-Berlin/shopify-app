import { either } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import { GraphQLError, print } from 'graphql';
import type { ReadonlyRecord } from '../../types';
import { isDefined } from '../../utils';
import type { GraphQLRequestConfig } from './request';

export type GraphQLRequestErrorConfig = {
  readonly message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: GraphQLRequestConfig<any, any>;
  readonly graphqlErrors?: ReadonlyArray<GraphQLError>;
  readonly networkError?: Error;
  readonly userErrors?: ReadonlyArray<UserError>;
};

export type UserError = {
  readonly message: string;
  readonly field?: ReadonlyArray<string>;
};

export type PrintedGraphQLRequestConfig = {
  readonly document: string;
  readonly variables: ReadonlyRecord;
};

export class GraphQLRequestError extends Error {
  readonly config: PrintedGraphQLRequestConfig;
  readonly graphqlErrors?: ReadonlyArray<GraphQLError>;
  readonly networkError?: Error;
  readonly userErrors?: ReadonlyArray<UserError>;

  constructor(config: GraphQLRequestErrorConfig) {
    super(config.message || mkErrorMessage(config));

    this.config = {
      document: print('query' in config.config ? config.config.query : config.config.mutation),
      variables: config.config.variables as ReadonlyRecord,
    };
    this.graphqlErrors = config.graphqlErrors?.length ? config.graphqlErrors : undefined;
    this.networkError = config.networkError;
    this.userErrors = config.userErrors?.length ? config.userErrors : undefined;
  }
}

function mkErrorMessage(config: GraphQLRequestErrorConfig): string {
  return [config.networkError, config.graphqlErrors, config.userErrors]
    .filter(isDefined)
    .flat()
    .map((error) => error.message)
    .join('\n');
}

type UnhandledUserError = {
  message: string;
  field?: ReadonlyArray<string> | null;
};

export function handleUserErrors<A, B>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: GraphQLRequestConfig<any, any>,
  getErrors: (input: A) => ReadonlyArray<UnhandledUserError> | undefined | null,
  getResult: (input: A) => B | undefined | null,
) {
  return (input: A): Either<GraphQLRequestError, B> => {
    const errors = getErrors(input);
    const result = getResult(input);

    if (errors != null || result == null) {
      return either.left(
        new GraphQLRequestError({
          config,
          userErrors: errors?.map((error) => ({
            ...error,
            field: error.field ?? undefined,
          })),
        }),
      );
    }

    return either.right(result);
  };
}
