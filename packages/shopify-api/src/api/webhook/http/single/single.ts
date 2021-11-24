import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GID } from '@shopfabrik/gid';
import { option, readerTaskEither, readonlyArray } from 'fp-ts';
import { flow, pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import { ClientGraphqlPayload, graphql } from '../../../../client';
import type * as GQL from '../../../../schema.generated';
import * as webhook from '../../WebhookSubscription';
import { WebhookSubscriptionRemoveFragmentDoc } from './WebhookSubscriptionRemove.generated';

export type FindInput<A extends Partial<GQL.WebhookSubscription>> = {
  readonly fragment: TypedDocumentNode<A>;
  readonly variables: {
    readonly topic: GQL.WebhookSubscriptionTopic;
    readonly callbackUrl: string;
  };
};

export function find<A extends Partial<GQL.WebhookSubscription>>(
  input: FindInput<A>,
): ClientGraphqlPayload<Option<A>> {
  return pipe(
    webhook.connection({
      fragment: input.fragment,
      variables: {
        first: 1,
        topics: input.variables.topic,
        callbackUrl: input.variables.callbackUrl,
      },
    }),
    readerTaskEither.map(flow(graphql.pagination.nodesFromConnection, readonlyArray.head)),
  );
}

export type RemoveInput = {
  readonly topic: GQL.WebhookSubscriptionTopic;
  readonly callbackUrl: string;
};

export function remove(input: RemoveInput): ClientGraphqlPayload<Option<GID>> {
  return pipe(
    find({
      fragment: WebhookSubscriptionRemoveFragmentDoc,
      variables: input,
    }),
    readerTaskEither.chain(
      option.fold(
        () => readerTaskEither.of(option.none),
        (_webhook) => webhook.remove(_webhook.id),
      ),
    ),
  );
}
