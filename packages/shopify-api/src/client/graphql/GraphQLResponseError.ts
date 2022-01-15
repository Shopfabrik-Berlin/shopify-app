import type { GraphQLError } from 'graphql';
import { nullish } from '../../utils';
import type { GraphQLRequest } from './client';
import type { OperationContext } from './document';
import * as document from './document';

export type GraphQLResponseErrorInit = {
  readonly request: GraphQLRequest;
  readonly message?: string;
  readonly graphqlErrors?: readonly GraphQLError[];
  readonly userErrors?: readonly UserError[];
};

export type UserError = {
  readonly message: string;
  readonly field?: readonly string[];
};

export type GraphQLRequestContext = OperationContext & {
  readonly variables: unknown;
};

export class GraphQLResponseError extends Error {
  readonly request: GraphQLRequestContext;
  readonly graphqlErrors?: readonly GraphQLError[];
  readonly userErrors?: readonly UserError[];

  constructor(init: GraphQLResponseErrorInit) {
    super(init.message || createErrorMessage(init) || 'Unknown GraphQL Error');

    this.request = {
      ...document.getOperationContext(init.request.document),
      variables: init.request.variables,
    };
    this.graphqlErrors = init.graphqlErrors?.length ? init.graphqlErrors : undefined;
    this.userErrors = init.userErrors?.length ? init.userErrors : undefined;

    Object.defineProperty(this, 'name', { value: 'GraphQLResponseError' });
  }
}

function createErrorMessage(config: GraphQLResponseErrorInit): string {
  return [config.graphqlErrors, config.userErrors]
    .flat()
    .filter(nullish.isNot)
    .map((error) => error.message)
    .join('\n');
}

export type UnhandledUserError = {
  message: string;
  field?: readonly string[] | null;
};

export function handleUserErrors<A, B>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: GraphQLRequest<A, any>,
  errors: readonly UnhandledUserError[] | null | undefined,
  result: B | null | undefined,
): B {
  if (errors?.length || result == null) {
    throw new GraphQLResponseError({
      request,
      userErrors: errors?.map((error) => ({
        ...error,
        field: error.field ?? undefined,
      })),
    });
  }

  return result;
}
