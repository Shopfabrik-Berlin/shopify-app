import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GID } from '@shopfabrik/shopify-data';
import { option, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import { ClientGraphqlPayload, graphql } from '../../client';
import type { PaginationConnection } from '../../client/graphql';
import type * as GQL from '../../schema.generated';
import {
  WebhookSubscriptionCreateDocument,
  WebhookSubscriptionCreateMutationVariables,
} from './webhookSubscriptionCreate.generated';
import { WebhookSubscriptionDeleteDocument } from './webhookSubscriptionDelete.generated';
import {
  WebhookSubscriptionsDocument,
  WebhookSubscriptionsQueryVariables,
} from './webhookSubscriptions.generated';

export type ConnectionInput<A extends Partial<GQL.WebhookSubscription>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: WebhookSubscriptionsQueryVariables;
};

export function connection<A extends Partial<GQL.WebhookSubscription>>(
  input: ConnectionInput<A>,
): ClientGraphqlPayload<PaginationConnection<A>> {
  return (env) => {
    return pipe(
      env.shopify.client.graphql.query({
        query: WebhookSubscriptionsDocument(input.fragment),
        variables: input.variables,
      }),
      taskEither.map((query) => query.webhookSubscriptions),
    );
  };
}

export type CreateInput<A extends Partial<GQL.WebhookSubscription>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: WebhookSubscriptionCreateMutationVariables;
};

export function create<A extends Partial<GQL.WebhookSubscription>>(
  input: CreateInput<A>,
): ClientGraphqlPayload<A> {
  const config = {
    mutation: WebhookSubscriptionCreateDocument(input.fragment),
    variables: input.variables,
  };

  return (env) => {
    return pipe(
      env.shopify.client.graphql.mutate(config),
      taskEither.chainEitherK(
        graphql.error.handleUserErrors(
          config,
          (response) => response.webhookSubscriptionCreate?.userErrors,
          (response) => response.webhookSubscriptionCreate?.webhookSubscription,
        ),
      ),
    );
  };
}

export function remove(id: GID): ClientGraphqlPayload<Option<GID>> {
  return (env) => {
    return pipe(
      env.shopify.client.graphql.mutate({
        mutation: WebhookSubscriptionDeleteDocument,
        variables: {
          id,
        },
      }),
      taskEither.map((mutation) =>
        option.fromNullable(mutation.webhookSubscriptionDelete?.deletedWebhookSubscriptionId),
      ),
    );
  };
}
