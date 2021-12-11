import type { ShopOrigin } from '@shopfabrik/shopify-data';
import * as fc from 'fast-check';
import { either, option } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import { decode, sign, verify } from './jwt';
import * as token from './token';

describe('jwt', () => {
  describe('decode', () => {
    const VALID_JWT = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
      'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    ];

    it('returns none on decode failure', () => {
      expect(decode('')).toStrictEqual(option.none);
      expect(decode([VALID_JWT[0], 'xxx', VALID_JWT[2]].join('.'))).toStrictEqual(option.none);
    });

    it('returns decoded payload on success', () => {
      expect(decode(VALID_JWT.join('.'))).toStrictEqual(
        option.some({
          sub: '1234567890',
          name: 'John Doe',
          iat: 1516239022,
        }),
      );
    });
  });

  describe('sign', () => {
    const decodeTokenPayload = (token: string): object => {
      return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) as object;
    };

    it('propagates jsonwebtoken errors', async () => {
      const token = await sign({
        shopOrigin: 'test.myshopify.com' as ShopOrigin,
      })({ key: '', secret: '' })();

      expect(either.toUnion(token)).toBeInstanceOf(Error);
    });

    it('generates token with valid `dest` and `aud` payload fields', async () => {
      const token = await sign(
        {
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
        },
        {
          noTimestamp: true,
        },
      )({ key: 'key', secret: 'secret' })();

      expect(pipe(token, either.map(decodeTokenPayload))).toStrictEqual(
        either.right({
          aud: 'key',
          dest: 'https://test.myshopify.com',
        }),
      );
    });

    it('generates token with additional payload fields', async () => {
      const token = await sign(
        {
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          test: 'test',
        },
        {
          noTimestamp: true,
        },
      )({ key: 'key', secret: 'secret' })();

      expect(pipe(token, either.map(decodeTokenPayload))).toStrictEqual(
        either.right({
          aud: 'key',
          dest: 'https://test.myshopify.com',
          test: 'test',
        }),
      );
    });

    it('propagates jsonwebtoken options', async () => {
      const token = await sign(
        {
          iat: 1000,
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
        },
        {
          expiresIn: 2000,
          issuer: 'issuer',
          jwtid: 'jwtid',
          notBefore: 1000,
          subject: 'subject',
        },
      )({ key: 'key', secret: 'secret' })();

      expect(pipe(token, either.map(decodeTokenPayload))).toStrictEqual(
        either.right({
          aud: 'key',
          dest: 'https://test.myshopify.com',
          exp: 3000,
          iat: 1000,
          iss: 'issuer',
          jti: 'jwtid',
          nbf: 2000,
          sub: 'subject',
        }),
      );
    });
  });

  describe('verify', () => {
    it('verifies signed token', () => {
      return fc.assert(
        fc.asyncProperty(token.arbitraryWithParts(), async (_token) => {
          const [token, parts] = await _token;
          const result = await verify(token)(parts.apiCredentials)();

          expect(result).toStrictEqual(
            either.right({
              aud: parts.apiCredentials.key,
              dest: `https://${parts.shopOrigin}`,
              payload: parts.payload,
            }),
          );
        }),
      );
    });
  });
});
