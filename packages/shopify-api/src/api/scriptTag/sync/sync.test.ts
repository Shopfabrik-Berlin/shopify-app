import { gid, ShopOrigin } from '@shopfabrik/shopify-data';
import { either } from 'fp-ts';
import { setupServer } from 'msw/node';
import { ClientGraphqlEnv, mkClientGraphqlEnv } from '../../../client/graphql';
import * as scriptTagCreateMock from '../scriptTagCreate.mock';
import * as scriptTagDeleteMock from '../scriptTagDelete.mock';
import * as scriptTagsMock from '../scriptTags.mock';
import { syncMinimal, SyncMinimalPayload } from './sync';

const server = setupServer();

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe('api', () => {
  describe('scriptTag', () => {
    describe('syncMinimal', () => {
      const scriptTagId = gid.shopify.unsafeEncode('ScriptTag')('001');

      const env = (): ClientGraphqlEnv => {
        return mkClientGraphqlEnv({
          accessToken: 'accessToken',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
        });
      };

      it('creates missing ScriptTags', async () => {
        server.use(
          scriptTagsMock.mockConnection([]),

          scriptTagCreateMock.mockRight({
            id: scriptTagId,
          }),
        );

        const result = await syncMinimal({
          scriptTags: [
            {
              cache: true,
              displayScope: 'ONLINE_STORE',
              src: 'https://test.com',
            },
          ],
          limit: 10,
        })(env())();

        expect(either.toUnion(result)).toStrictEqual<SyncMinimalPayload>({
          deletedScriptTagIds: [],
          scriptTags: [
            {
              id: scriptTagId,
              cache: true,
              displayScope: 'ONLINE_STORE',
              src: 'https://test.com',
            },
          ],
        });
      });

      it('removes extra ScriptTags', async () => {
        server.use(
          scriptTagsMock.mockConnection([
            {
              id: scriptTagId,
              cache: false,
              displayScope: 'ALL',
              src: 'https://invalid.com',
            },
          ]),

          scriptTagDeleteMock.mockRight(scriptTagId),
        );

        const result = await syncMinimal({
          scriptTags: [],
          limit: 10,
        })(env())();

        expect(either.toUnion(result)).toStrictEqual<SyncMinimalPayload>({
          deletedScriptTagIds: [scriptTagId],
          scriptTags: [],
        });
      });
    });
  });
});
