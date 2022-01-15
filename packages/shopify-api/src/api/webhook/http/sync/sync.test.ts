import { gid } from '@shopfabrik/shopify-data';
import { _sync, _Sync } from './sync';

describe('api', () => {
  describe('webhook', () => {
    describe('sync', () => {
      it('creates missing webhook', async () => {
        const webhookId = gid.shopify.unsafeEncode('WebhookSubscription')('001');

        const env: _Sync['Env'] = {
          createWebhook: async (input) => {
            return {
              id: webhookId,
              topic: input.topic,
              endpoint: {
                __typename: 'WebhookHttpEndpoint',
                callbackUrl: input.webhookSubscription.callbackUrl,
              },
            } as never;
          },
          listWebhooks: async () => {
            return [];
          },
          removeWebhook: async ({ id }) => {
            return id;
          },
        };

        const result = await _sync(env, {
          limit: 10,
          topic: 'APP_UNINSTALLED',
          callbackUrl: 'https://test.com',
        });

        expect(result).toStrictEqual<_Sync['Output']>({
          deletedWebhookIds: [],
          webhook: {
            id: webhookId,
            topic: 'APP_UNINSTALLED',
            endpoint: {
              __typename: 'WebhookHttpEndpoint',
              callbackUrl: 'https://test.com',
            },
          },
        });
      });

      it('removes extra webhooks with same url', async () => {
        const env: _Sync['Env'] = {
          createWebhook: async () => {
            return {} as never;
          },
          listWebhooks: async () => {
            return [
              {
                id: gid.shopify.unsafeEncode('WebhookSubscription')('001'),
                topic: 'APP_UNINSTALLED',
                endpoint: {
                  __typename: 'WebhookHttpEndpoint',
                  callbackUrl: 'https://valid.com',
                },
              },
              {
                id: gid.shopify.unsafeEncode('WebhookSubscription')('002'),
                topic: 'APP_UNINSTALLED',
                endpoint: {
                  __typename: 'WebhookHttpEndpoint',
                  callbackUrl: 'https://invalid.com',
                },
              },
            ];
          },
          removeWebhook: async ({ id }) => {
            return id;
          },
        };

        const result = await _sync(env, {
          limit: 10,
          topic: 'APP_UNINSTALLED',
          callbackUrl: 'https://valid.com',
        });

        expect(result).toStrictEqual<_Sync['Output']>({
          deletedWebhookIds: [gid.shopify.unsafeEncode('WebhookSubscription')('002')],
          webhook: {
            id: gid.shopify.unsafeEncode('WebhookSubscription')('001'),
            topic: 'APP_UNINSTALLED',
            endpoint: {
              __typename: 'WebhookHttpEndpoint',
              callbackUrl: 'https://valid.com',
            },
          },
        });
      });
    });
  });
});
