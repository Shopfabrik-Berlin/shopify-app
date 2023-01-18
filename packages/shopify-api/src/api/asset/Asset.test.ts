import { gid, ShopOrigin } from '@shopfabrik/shopify-data';
import * as cache from '../../cache';
import { rest } from '../../client';
import * as _ from './Asset';

describe('api', () => {
  describe('Asset', () => {
    describe('find', () => {
      it('fetches single asset if it exists', async () => {
        const asset = { key: 'asset-001' };

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch: jest.fn(async () => {
            return {
              status: 200,
              async json() {
                return { asset };
              },
            };
          }),
        });

        const input = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: asset.key,
        };

        const result = await _.find(env, input);

        expect(result).toStrictEqual(asset);
      });

      it('returns void if asset does not exist', async () => {
        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch: jest.fn(async () => {
            return {
              status: 404,
              async json() {
                return {};
              },
            };
          }),
        });

        const input = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: 'asset-001',
        };

        const result = await _.find(env, input);

        expect(result).toBeNull();
      });
    });

    describe('get', () => {
      it('fetches single asset', async () => {
        const asset = { key: 'asset-001' };
        const fetch = jest.fn(async () => {
          return {
            status: 200,
            json: async () => {
              return { asset };
            },
          };
        });

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch,
        });

        const input = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: asset.key,
        };

        const result = await _.get(env, input);

        expect(fetch).toHaveBeenCalledWith(
          'https://test.myshopify.com/admin/api/2022-10/themes/001/assets.json?asset[key]=asset-001',
          {
            headers: {
              'x-shopify-access-token': 'access-token',
            },
          },
        );

        expect(result).toStrictEqual(asset);
      });

      it('caches requests', async () => {
        const fetch = jest.fn();

        const env = {
          ...cache.createEnv(),
          ...rest.createEnv({
            accessToken: 'access-token',
            shopOrigin: 'test.myshopify.com' as ShopOrigin,
            fetch,
          }),
        };

        const assetA = { key: 'asset-001' };
        fetch.mockResolvedValueOnce({
          status: 200,
          async json() {
            return { asset: assetA };
          },
        });
        const resultA = await _.get(env, {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: assetA.key,
        });
        expect(resultA).toStrictEqual(assetA);
        expect(fetch).toHaveBeenCalledTimes(1);

        const assetB = { key: 'asset-002' };
        fetch.mockResolvedValueOnce({
          status: 200,
          async json() {
            return { asset: assetB };
          },
        });
        const resultB = await _.get(env, {
          themeId: gid.shopify.unsafeEncode('Theme')('002'),
          key: assetB.key,
        });
        expect(resultB).toStrictEqual(assetB);
        expect(fetch).toHaveBeenCalledTimes(2);

        const resultC = await _.get(env, {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: assetA.key,
        });
        expect(resultC).toStrictEqual(assetA);
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('list', () => {
      it('fetches theme asset list', async () => {
        const assets = [{ key: 'asset-001' }];
        const fetch = jest.fn(async () => {
          return {
            status: 200,
            json: async () => {
              return { assets };
            },
          };
        });

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch,
        });

        const result = await _.list(env, gid.shopify.unsafeEncode('Theme')('001'));

        expect(fetch).toHaveBeenCalledWith(
          'https://test.myshopify.com/admin/api/2022-10/themes/001/assets.json',
          {
            headers: {
              'x-shopify-access-token': 'access-token',
            },
          },
        );

        expect(result).toStrictEqual(assets);
      });

      it('caches requests', async () => {
        const fetch = jest.fn();

        const env = {
          ...cache.createEnv(),
          ...rest.createEnv({
            accessToken: 'access-token',
            shopOrigin: 'test.myshopify.com' as ShopOrigin,
            fetch,
          }),
        };

        const assetsA = [{ key: 'asset-001' }];
        fetch.mockResolvedValueOnce({
          status: 200,
          json: async () => {
            return { assets: assetsA };
          },
        });
        const resultA = await _.list(env, gid.shopify.unsafeEncode('Theme')('001'));
        expect(resultA).toStrictEqual(assetsA);
        expect(fetch).toHaveBeenCalledTimes(1);

        const assetsB = [{ key: 'asset-002' }];
        fetch.mockResolvedValueOnce({
          status: 200,
          json: async () => {
            return { assets: assetsB };
          },
        });
        const resultB = await _.list(env, gid.shopify.unsafeEncode('Theme')('002'));
        expect(resultB).toStrictEqual(assetsB);
        expect(fetch).toHaveBeenCalledTimes(2);

        const resultC = await _.list(env, gid.shopify.unsafeEncode('Theme')('001'));
        expect(resultC).toStrictEqual(assetsA);
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('modify', () => {
      it.each(['attachment', 'value'] as const)('modifies asset %s', async (contentsKey) => {
        const asset = {
          key: 'asset-001',
          [contentsKey]: 'xxx',
        };

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          async fetch(_, init) {
            return {
              status: 200,
              async json() {
                if (init?.method === 'PUT') {
                  return JSON.parse(init?.body ?? '{}') as unknown;
                }

                return { asset };
              },
            };
          },
        });

        const input: _.Modify['Input'] = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: asset.key,
          modifyFn: () => 'yyy',
        };

        const result = await _.modify(env, input);

        expect(result).toStrictEqual({
          ...asset,
          [contentsKey]: 'yyy',
        });
      });

      it('does not modify asset when contents have not changed', async () => {
        const asset = {
          key: 'asset-001',
          value: 'xxx',
        };

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          async fetch(_, init) {
            if (init?.method === 'PUT') {
              return {
                status: 500,
                async json() {
                  return {};
                },
              };
            }

            return {
              status: 200,
              async json() {
                return { asset };
              },
            };
          },
        });

        const input: _.Modify['Input'] = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: asset.key,
          modifyFn: () => 'xxx',
        };

        const result = await _.modify(env, input);

        expect(result).toStrictEqual(asset);
      });
    });

    describe('remove', () => {
      it('removes asset', async () => {
        const fetch = jest.fn(async () => {
          return {
            status: 200,
            async json() {
              return {};
            },
          };
        });

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch,
        });

        const input = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: 'asset-001',
        };

        const result = await _.remove(env, input);

        expect(fetch).toHaveBeenCalledWith(
          'https://test.myshopify.com/admin/api/2022-10/themes/001/assets.json?asset[key]=asset-001',
          {
            method: 'DELETE',
            headers: {
              'x-shopify-access-token': 'access-token',
            },
          },
        );

        expect(result).toBeUndefined();
      });

      it('clears cached assets', async () => {
        const asset = {
          key: 'asset-001',
        } as _.Asset;

        const input: _.Remove['Input'] = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: asset.key,
        };

        const env = {
          ...cache.createEnv(),
          ...rest.createEnv({
            accessToken: 'access-token',
            shopOrigin: 'test.myshopify.com' as ShopOrigin,
            fetch: jest.fn(async () => {
              return {
                status: 200,
                async json() {
                  return {};
                },
              };
            }),
          }),
        };

        const assetCache = _.getAssetCache(env);
        assetCache.set(input, Promise.resolve(asset));

        const assetMetaCache = _.getAssetMetaCache(env);
        assetMetaCache.set(input.themeId, Promise.resolve([asset]));

        await _.remove(env, input);

        expect(assetCache.get(input)).toBeUndefined();
        expect(assetMetaCache.get(input.themeId)).toBeUndefined();
      });
    });

    describe('set', () => {
      it('sets asset value', async () => {
        const asset = { key: 'asset-001' };
        const fetch = jest.fn(async () => {
          return {
            status: 200,
            async json() {
              return { asset };
            },
          };
        });

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch,
        });

        const input = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: asset.key,
          value: 'new contents',
        };

        const result = await _.set(env, input);

        expect(fetch).toHaveBeenCalledWith(
          'https://test.myshopify.com/admin/api/2022-10/themes/001/assets.json',
          {
            method: 'PUT',
            headers: {
              'content-type': 'application/json',
              'x-shopify-access-token': 'access-token',
            },
            body: JSON.stringify({
              asset: {
                key: asset.key,
                value: 'new contents',
              },
            }),
          },
        );

        expect(result).toStrictEqual(asset);
      });

      it('clears cached assets', async () => {
        const asset = {
          key: 'asset-001',
        } as _.Asset;

        const env = {
          ...cache.createEnv(),
          ...rest.createEnv({
            accessToken: 'access-token',
            shopOrigin: 'test.myshopify.com' as ShopOrigin,
            async fetch() {
              return {
                status: 200,
                async json() {
                  return { asset };
                },
              };
            },
          }),
        };

        const input = {
          themeId: gid.shopify.unsafeEncode('Theme')('001'),
          key: asset.key,
        };

        const assetCache = _.getAssetCache(env);
        assetCache.set(input, Promise.resolve(asset));

        const assetMetaCache = _.getAssetMetaCache(env);
        assetMetaCache.set(input.themeId, Promise.resolve([asset]));

        await _.set(env, {
          ...input,
          value: 'new contents',
        });

        expect(assetCache.get(input)).toBeUndefined();
        expect(assetMetaCache.get(input.themeId)).toBeUndefined();
      });
    });
  });
});
