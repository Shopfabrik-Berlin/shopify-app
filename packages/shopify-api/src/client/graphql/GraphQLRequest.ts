import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import * as document from './document';

export type GraphQLRequest<A = unknown, I = unknown> = {
  readonly document: TypedDocumentNode<A, I>;
  readonly variables: I;
};

export type DocumentMatcher<A, I> = {
  document: TypedDocumentNode<A, I>;
  handler: (variables: I) => Promise<A>;
};

export type InferHandlerFromDocument<T> = T extends TypedDocumentNode<infer A, infer I>
  ? (variables: I) => Promise<A>
  : never;

export function matcher<A, I>(
  document: TypedDocumentNode<A, I>,
  handler: (variables: I) => Promise<A>,
): DocumentMatcher<A, I> {
  return { document, handler };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function match<T extends readonly DocumentMatcher<any, any>[]>(...matchers: T) {
  return <A, I>(request: GraphQLRequest<A, I>): Promise<A> => {
    const response = matchers
      .find((matcher): matcher is DocumentMatcher<A, I> => matcher.document === request.document)
      ?.handler(request.variables);

    if (!response) {
      const context = document.getOperationContext(request.document);
      throw new Error(`No matchers found for ${context.type} ${context.name}`);
    }

    return response;
  };
}
