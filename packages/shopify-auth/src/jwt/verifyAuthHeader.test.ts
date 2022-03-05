import type { ShopOrigin } from '@shopfabrik/shopify-data';
import * as fc from 'fast-check';
import { JsonWebTokenError } from 'jsonwebtoken';
import type { ApiCredentials } from '../apiCredentials';
import { sign } from './jwt';
import * as token from './token';
import { verifyAuthHeader, VerifyAuthHeaderInput } from './verifyAuthHeader';

const defaultCredentials: ApiCredentials = {
  key: 'key',
  secret: 'secret',
};

const getApiSecret: VerifyAuthHeaderInput['getApiSecret'] = () => defaultCredentials.secret;

const createAuthHeader = async (shopOrigin: string): Promise<string> => {
  const token = await sign({
    credentials: defaultCredentials,
    shopOrigin: shopOrigin as ShopOrigin,
    options: {
      noTimestamp: true,
    },
  });

  return `Bearer ${token}`;
};

describe('jwt', () => {
  describe('verifyAuthHeader', () => {
    it('returns JsonWebTokenError when header is missing', () => {
      const result = verifyAuthHeader({
        getApiSecret,
      });

      return expect(result).rejects.toBeInstanceOf(JsonWebTokenError);
    });

    it('returns JsonWebTokenError when header is invalid', () => {
      const result = verifyAuthHeader({
        getApiSecret,
        header: 'xxx',
      });

      return expect(result).rejects.toBeInstanceOf(JsonWebTokenError);
    });

    it('returns JsonWebTokenError when token is invalid', async () => {
      const header = await createAuthHeader('test.myshopify.com');
      const result = verifyAuthHeader({
        getApiSecret,
        header: header + 'xxx',
      });

      return expect(result).rejects.toBeInstanceOf(JsonWebTokenError);
    });

    it('returns JsonWebTokenError when payload does not have ShopOrigin in `dest` field', async () => {
      const header = await createAuthHeader('xxx');
      const result = verifyAuthHeader({
        getApiSecret,
        header,
      });

      return expect(result).rejects.toBeInstanceOf(JsonWebTokenError);
    });

    it('returns verified payload with ShopOrigin for valid input', () => {
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

          const result = await verifyAuthHeader({
            getApiSecret: (decodedToken) => {
              expect(decodedToken).toStrictEqual(expected);

              return parts.apiCredentials.secret;
            },
            header: `Bearer ${token}`,
          });

          expect(result).toStrictEqual(expected);
        }),
      );
    });
  });
});
