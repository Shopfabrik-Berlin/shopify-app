import { gid, ShopOrigin } from '@shopfabrik/shopify-data';
import * as cache from '../../cache';
import { rest } from '../../client';
import * as _ from './Theme';

describe('api', () => {
  describe('Theme', () => {
    describe('find', () => {
      it('fetches single theme if it exists', async () => {
        const theme = { id: 1 };

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch: jest.fn(async () => {
            return {
              status: 200,
              async json() {
                return { theme };
              },
            };
          }),
        });

        const result = await _.find(env, gid.shopify.unsafeEncode('Theme')('001'));

        expect(result).toStrictEqual(theme);
      });

      it('returns void if theme does not exist', async () => {
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

        const result = await _.find(env, gid.shopify.unsafeEncode('Theme')('001'));

        expect(result).toBeNull();
      });
    });

    describe('get', () => {
      it('fetches single theme', async () => {
        const theme = { id: 1 };
        const fetch = jest.fn(async () => {
          return {
            status: 200,
            async json() {
              return { theme };
            },
          };
        });

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch,
        });

        const result = await _.get(env, gid.shopify.unsafeEncode('Theme')('001'));

        expect(fetch).toHaveBeenCalledWith(
          'https://test.myshopify.com/admin/api/2022-10/themes/001.json',
          {
            headers: {
              'x-shopify-access-token': 'access-token',
            },
          },
        );

        expect(result).toStrictEqual(theme);
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

        const themeA = { id: 1 };
        fetch.mockResolvedValueOnce({
          status: 200,
          async json() {
            return { theme: themeA };
          },
        });
        const resultA = await _.get(env, gid.shopify.unsafeEncode('Theme')('001'));
        expect(resultA).toStrictEqual(themeA);
        expect(fetch).toHaveBeenCalledTimes(1);

        const themeB = { id: 2 };
        fetch.mockResolvedValueOnce({
          status: 200,
          async json() {
            return { theme: themeB };
          },
        });
        const resultB = await _.get(env, gid.shopify.unsafeEncode('Theme')('002'));
        expect(resultB).toStrictEqual(themeB);
        expect(fetch).toHaveBeenCalledTimes(2);

        const resultC = await _.get(env, gid.shopify.unsafeEncode('Theme')('001'));
        expect(resultC).toStrictEqual(themeA);
        expect(fetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('list', () => {
      it('fetches themes', async () => {
        const themes = [{ id: 1 }];
        const fetch = jest.fn(async () => {
          return {
            status: 200,
            async json() {
              return { themes };
            },
          };
        });

        const env = rest.createEnv({
          accessToken: 'access-token',
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          fetch,
        });

        const result = await _.list(env);

        expect(fetch).toHaveBeenCalledWith(
          'https://test.myshopify.com/admin/api/2022-10/themes.json',
          {
            headers: {
              'x-shopify-access-token': 'access-token',
            },
          },
        );

        expect(result).toStrictEqual(themes);
      });

      it('caches requests', async () => {
        const themes = [{ id: 1 }];
        const fetch = jest.fn(async () => {
          return {
            status: 200,
            async json() {
              return { themes };
            },
          };
        });

        const env = {
          ...cache.createEnv(),
          ...rest.createEnv({
            accessToken: 'access-token',
            shopOrigin: 'test.myshopify.com' as ShopOrigin,
            fetch,
          }),
        };

        const resultA = await _.list(env);
        expect(resultA).toStrictEqual(themes);
        expect(fetch).toHaveBeenCalledTimes(1);

        const resultB = await _.list(env);
        expect(resultB).toStrictEqual(themes);
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
