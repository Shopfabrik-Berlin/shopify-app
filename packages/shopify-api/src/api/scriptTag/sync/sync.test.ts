import { gid } from '@shopfabrik/shopify-data';
import { _sync, _Sync } from './sync';

describe('api', () => {
  describe('scriptTag', () => {
    describe('sync', () => {
      it('creates missing ScriptTags', async () => {
        const scriptTagId = gid.shopify.unsafeEncode('ScriptTag')('001');

        const env: _Sync['Env'] = {
          createScriptTag: async ({ input }) => {
            return {
              id: scriptTagId,
              ...input,
            } as never;
          },
          listScriptTags: async () => {
            return [];
          },
          removeScriptTag: async ({ id }) => {
            return id;
          },
        };

        const result = await _sync(env, {
          limit: 10,
          scriptTags: [
            {
              cache: true,
              displayScope: 'ONLINE_STORE',
              src: 'https://test.com',
            },
          ],
        });

        expect(result).toStrictEqual<_Sync['Output']>({
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
        const scriptTagId = gid.shopify.unsafeEncode('ScriptTag')('001');

        const env: _Sync['Env'] = {
          createScriptTag: async () => {
            return {} as never;
          },
          listScriptTags: async () => {
            return [{ id: scriptTagId }] as never;
          },
          removeScriptTag: async ({ id }) => {
            return id;
          },
        };

        const result = await _sync(env, {
          scriptTags: [],
          limit: 10,
        });

        expect(result).toStrictEqual<_Sync['Output']>({
          deletedScriptTagIds: [scriptTagId],
          scriptTags: [],
        });
      });
    });
  });
});
