import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { option, readerTaskEither, readonlyArray } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import { ClientGraphqlPayload, graphql } from '../../../../../client';
import type * as GQL from '../../../../../schema.generated';
import * as webhook from '../../../WebhookSubscription';
import {
  WebhookSubscriptionSyncFragment,
  WebhookSubscriptionSyncFragmentDoc,
} from './WebhookSubscriptionSync.generated';

export type WebhookSubscriptionSync = Partial<GQL.WebhookSubscription> &
  WebhookSubscriptionSyncFragment;

export type SyncMinimalInput = SyncVariables;

export type SyncMinimalPayload = WebhookSubscriptionSyncFragment;

export function syncMinimal(input: SyncMinimalInput): ClientGraphqlPayload<SyncMinimalPayload> {
  return sync({
    fragment: WebhookSubscriptionSyncFragmentDoc,
    variables: input,
  });
}

export type SyncVariables = {
  readonly topic: GQL.WebhookSubscriptionTopic;
  readonly callbackUrl: string;
  readonly limit?: number;
};

export type SyncInput<A extends WebhookSubscriptionSync> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: SyncVariables;
};

export function sync<A extends WebhookSubscriptionSync>(
  input: SyncInput<A>,
): ClientGraphqlPayload<A> {
  return pipe(
    getWebhooksByTopic(input),
    readerTaskEither.chain(([valid, invalid]) => {
      const createIfMissing = pipe(
        valid,
        option.fold(() => {
          return webhook.create({
            fragment: input.fragment,
            variables: {
              topic: input.variables.topic,
              webhookSubscription: {
                callbackUrl: input.variables.callbackUrl,
              },
            },
          });
        }, readerTaskEither.of),
      );

      const removeInvalid = pipe(
        invalid,
        readonlyArray.traverse(readerTaskEither.ApplicativePar)((_webhook) =>
          webhook.remove(_webhook.id),
        ),
      );

      return pipe(createIfMissing, readerTaskEither.apFirst(removeInvalid));
    }),
  );
}

type GetWebhooksByTopicInput<A extends WebhookSubscriptionSync> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: SyncVariables;
};

type GetWebhooksByTopicPayload<A extends WebhookSubscriptionSync> = readonly [
  valid: Option<A>,
  invalid: ReadonlyArray<A>,
];

function getWebhooksByTopic<A extends WebhookSubscriptionSync>(
  input: GetWebhooksByTopicInput<A>,
): ClientGraphqlPayload<GetWebhooksByTopicPayload<A>> {
  return pipe(
    webhook.connection({
      fragment: input.fragment,
      variables: {
        topics: input.variables.topic,
        first: input.variables.limit ?? 10,
      },
    }),

    readerTaskEither.map((connection) => {
      const { left, right } = pipe(
        graphql.pagination.nodesFromConnection(connection),
        readonlyArray.partition(
          (webhook) =>
            webhook.endpoint.__typename === 'WebhookHttpEndpoint' &&
            webhook.endpoint.callbackUrl === input.variables.callbackUrl,
        ),
      );

      return [readonlyArray.head(right), left];
    }),
  );
}
