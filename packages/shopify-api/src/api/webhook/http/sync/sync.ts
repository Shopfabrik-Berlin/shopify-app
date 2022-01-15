import type { GID } from '@shopfabrik/shopify-data';
import { graphql } from '../../../../client';
import type * as GQL from '../../../../schema.generated';
import { nullish, rio } from '../../../../utils';
import {
  HttpWebhookSubscriptionSyncFragment,
  WebhookSubscriptionCreateDocument,
  WebhookSubscriptionDeleteDocument,
  WebhookSubscriptionsDocument,
} from './sync.generated';

export type { HttpWebhookSubscriptionSyncFragment };

export type Sync = rio.p.TypeFn<typeof sync>;

type SyncInput = {
  topic: GQL.WebhookSubscriptionTopic;
  callbackUrl: string;
  limit: number;
};

type SyncPayload = {
  readonly deletedWebhookIds: readonly GID[];
  readonly webhook: HttpWebhookSubscriptionSyncFragment;
};

const createWebhook = graphql.rio.fromDocumentWithUserErrors(
  WebhookSubscriptionCreateDocument,
  (data) => data.webhookSubscriptionCreate?.userErrors,
  (data) => data.webhookSubscriptionCreate?.webhookSubscription,
);

const listWebhooks = rio.p.map(graphql.rio.fromDocument(WebhookSubscriptionsDocument), (data) =>
  graphql.pagination.nodesFromConnection(data.webhookSubscriptions),
);

const removeWebhook = rio.p.map(
  graphql.rio.fromDocument(WebhookSubscriptionDeleteDocument),
  (data) => data.webhookSubscriptionDelete?.deletedWebhookSubscriptionId,
);

export const sync = rio.mapEnv(
  _sync,
  rio.sequenceEnv({
    createWebhook,
    listWebhooks,
    removeWebhook,
  }),
);

export type _Sync = rio.p.TypeFn<typeof _sync>;

type _SyncEnv = rio.RemoveEnvS<{
  createWebhook: typeof createWebhook;
  listWebhooks: typeof listWebhooks;
  removeWebhook: typeof removeWebhook;
}>;

export async function _sync(env: _SyncEnv, input: SyncInput): Promise<SyncPayload> {
  const webhooks = await env.listWebhooks({
    first: input.limit,
    topics: input.topic,
  });

  const { existingWebhook, webhooksToDelete } = separateWebhooks(webhooks, input.callbackUrl);

  const webhookTask = existingWebhook
    ? Promise.resolve(existingWebhook)
    : env.createWebhook({
        topic: input.topic,
        webhookSubscription: {
          callbackUrl: input.callbackUrl,
        },
      });

  const deleteWebhooksTask = Promise.all(
    webhooksToDelete.map(({ id }) => env.removeWebhook({ id })),
  );

  const [deletedWebhookIds, webhook] = await Promise.all([deleteWebhooksTask, webhookTask]);

  return {
    deletedWebhookIds: deletedWebhookIds.filter(nullish.isNot),
    webhook,
  };
}

type SeparatedWebhooks = {
  existingWebhook?: HttpWebhookSubscriptionSyncFragment;
  webhooksToDelete: readonly HttpWebhookSubscriptionSyncFragment[];
};

function separateWebhooks(
  webhooks: readonly HttpWebhookSubscriptionSyncFragment[],
  callbackUrl: string,
): SeparatedWebhooks {
  const existingWebhook = webhooks.find(
    (webhook) =>
      webhook.endpoint.__typename === 'WebhookHttpEndpoint' &&
      webhook.endpoint.callbackUrl === callbackUrl,
  );

  const webhooksToDelete = existingWebhook
    ? webhooks.filter((webhook) => webhook !== existingWebhook)
    : webhooks;

  return {
    existingWebhook,
    webhooksToDelete,
  };
}
