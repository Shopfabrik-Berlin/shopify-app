import type { ShopOrigin } from '@shopfabrik/shopify-data';
import * as fc from 'fast-check';
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
      expect(decode('')).toBeNull();
      expect(decode([VALID_JWT[0], 'xxx', VALID_JWT[2]].join('.'))).toBeNull();
    });

    it('returns decoded payload on success', () => {
      expect(decode(VALID_JWT.join('.'))).toStrictEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
      });
    });
  });

  describe('sign', () => {
    const decodeTokenPayload = (token: string): object => {
      return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) as object;
    };

    it('propagates jsonwebtoken errors', () => {
      const token = sign({
        credentials: {
          key: '',
          secret: '',
        },
        shopOrigin: 'test.myshopify.com' as ShopOrigin,
      });

      return expect(token).rejects.toBeInstanceOf(Error);
    });

    it('generates token with valid `dest` and `aud` payload fields', async () => {
      const token = await sign({
        credentials: {
          key: 'key',
          secret: 'secret',
        },
        shopOrigin: 'test.myshopify.com' as ShopOrigin,
        options: {
          noTimestamp: true,
        },
      });

      expect(decodeTokenPayload(token)).toStrictEqual({
        aud: 'key',
        dest: 'https://test.myshopify.com',
      });
    });

    it('generates token with additional payload fields', async () => {
      const token = await sign(
        {
          credentials: {
            key: 'key',
            secret: 'secret',
          },
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          options: {
            noTimestamp: true,
          },
        },
        {
          test: 'test',
        },
      );

      expect(decodeTokenPayload(token)).toStrictEqual({
        aud: 'key',
        dest: 'https://test.myshopify.com',
        test: 'test',
      });
    });

    it('propagates jsonwebtoken options', async () => {
      const token = await sign(
        {
          credentials: {
            key: 'key',
            secret: 'secret',
          },
          shopOrigin: 'test.myshopify.com' as ShopOrigin,
          options: {
            expiresIn: 2000,
            issuer: 'issuer',
            jwtid: 'jwtid',
            notBefore: 1000,
            subject: 'subject',
          },
        },
        {
          iat: 1000,
        },
      );

      expect(decodeTokenPayload(token)).toStrictEqual({
        aud: 'key',
        dest: 'https://test.myshopify.com',
        exp: 3000,
        iat: 1000,
        iss: 'issuer',
        jti: 'jwtid',
        nbf: 2000,
        sub: 'subject',
      });
    });
  });

  describe('verify', () => {
    it('verifies signed token', () => {
      return fc.assert(
        fc.asyncProperty(token.arbitraryWithParts(), async (_token) => {
          const [token, parts] = await _token;
          const result = await verify(parts.apiCredentials, token);

          expect(result).toStrictEqual({
            aud: parts.apiCredentials.key,
            dest: `https://${parts.shopOrigin}`,
            payload: parts.payload,
          });
        }),
      );
    });
  });
});
