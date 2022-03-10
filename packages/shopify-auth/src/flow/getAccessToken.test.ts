import { HttpResponseError } from '../utils/error';
import {
  getAccessToken,
  GetAccessTokenEnv,
  GetAccessTokenInput,
  GetAccessTokenPayload,
} from './getAccessToken';

describe('flow', () => {
  describe('getAccessToken', () => {
    it('exchanges auth code for access token', () => {
      const input: GetAccessTokenInput = {
        api: {
          key: 'test-api-key',
          secret: 'test-api-secret',
        },
        code: 'test-code',
        shopOrigin: 'test.myshopify.com' as never,
      };

      const fetch: GetAccessTokenEnv['fetch'] = async (url, init) => {
        const body = JSON.parse(init.body || '') as Record<string, unknown>;

        if (
          url === `https://${input.shopOrigin}/admin/oauth/access_token` &&
          init.method === 'POST' &&
          init.headers?.['content-type'] === 'application/json' &&
          body.client_id === input.api.key &&
          body.client_secret === input.api.secret &&
          body.code === input.code
        ) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              access_token: 'test-access-token',
              scope: 'scopeA,scopeB',
            }),
          };
        }

        throw new Error('fail');
      };

      const result = getAccessToken({ fetch }, input);

      return expect(result).resolves.toStrictEqual<GetAccessTokenPayload>({
        accessToken: 'test-access-token',
        scopes: ['scopeA', 'scopeB'],
      });
    });

    it('throws FetchError if response is not ok', () => {
      const input: GetAccessTokenInput = {
        api: {
          key: 'test-api-key',
          secret: 'test-api-secret',
        },
        code: 'test-code',
        shopOrigin: 'test.myshopify.com' as never,
      };

      const fetch: GetAccessTokenEnv['fetch'] = async () => {
        return {
          ok: false,
          status: 401,
          json: async () => null,
        };
      };

      const result = getAccessToken({ fetch }, input);

      return expect(result).rejects.toBeInstanceOf(HttpResponseError);
    });
  });
});
