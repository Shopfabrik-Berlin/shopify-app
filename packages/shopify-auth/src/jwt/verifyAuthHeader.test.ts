import type { ShopOrigin } from '@shopfabrik/shopify-data';
import * as fc from 'fast-check';
import { either, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import { JsonWebTokenError } from 'jsonwebtoken';
import type { ApiCredentials } from '../apiCredentials';
import { sign } from './jwt';
import * as token from './token';
import { verifyAuthHeader, VerifyAuthHeaderEnv } from './verifyAuthHeader';

const defaultCredentials: ApiCredentials = {
  key: 'key',
  secret: 'secret',
};

const defaultEnv: VerifyAuthHeaderEnv = {
  getApiSecret: () => defaultCredentials.secret,
};

const mkAuthHeader = (shopOrigin: string): Promise<string> => {
  return pipe(
    sign({ shopOrigin: shopOrigin as ShopOrigin }, { noTimestamp: true })(defaultCredentials),
    taskEither.map((token) => `Bearer ${token}`),
    taskEither.getOrElse((error) => () => Promise.reject(error)),
  )();
};

describe('jwt', () => {
  describe('verifyAuthHeader', () => {
    it('returns JsonWebTokenError when header is missing', async () => {
      const result = await verifyAuthHeader()(defaultEnv)();

      expect(either.toUnion(result)).toBeInstanceOf(JsonWebTokenError);
    });

    it('returns JsonWebTokenError when header is invalid', async () => {
      const result = await verifyAuthHeader('xxx')(defaultEnv)();

      expect(either.toUnion(result)).toBeInstanceOf(JsonWebTokenError);
    });

    it('returns JsonWebTokenError when token is invalid', async () => {
      const header = await mkAuthHeader('test.myshopify.com');
      const result = await verifyAuthHeader(header + 'xxx')(defaultEnv)();

      expect(either.toUnion(result)).toBeInstanceOf(JsonWebTokenError);
    });

    it('returns JsonWebTokenError when payload does not have ShopOrigin in `dest` field', async () => {
      const header = await mkAuthHeader('xxx');
      const result = await verifyAuthHeader(header)(defaultEnv)();

      expect(either.toUnion(result)).toBeInstanceOf(JsonWebTokenError);
    });

    it('returns verified payload with ShopOrigin for valid input', async () => {
      return fc.assert(
        fc.asyncProperty(token.arbitraryWithParts(), async (_token) => {
          const [token, parts] = await _token;

          const expected = {
            payload: {
              aud: parts.apiCredentials.key,
              dest: `https://${parts.shopOrigin}`,
              payload: parts.payload,
            },
            shopOrigin: parts.shopOrigin.toLowerCase(),
          };

          const result = await verifyAuthHeader(`Bearer ${token}`)({
            getApiSecret: (decodedToken) => {
              expect(decodedToken).toStrictEqual(expected);

              return parts.apiCredentials.secret;
            },
          })();

          expect(result).toStrictEqual(either.right(expected));
        }),
      );
    });
  });
});
