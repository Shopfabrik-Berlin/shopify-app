import * as crypto from 'crypto';
import { either } from 'fp-ts';
import { URLSearchParams } from 'url';
import { HmacError, verifyHmac, verifySignature } from './hmac';

const createHmac = (secret: string, payload: string): string => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

describe('hmac', () => {
  describe('verifyHmac', () => {
    it('returns HmacError (INVALID_INPUT) for input with invalid "shop" param', () => {
      const result = either.toUnion(
        verifyHmac(new URLSearchParams('shop=xxx'))({
          getApiSecret: () => 'secret',
        }),
      );

      expect(result).toBeInstanceOf(HmacError);
      expect(result).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('returns HmacError (INVALID_INPUT) for input without "hmac" param', () => {
      const result = either.toUnion(
        verifyHmac(new URLSearchParams('shop=test.myshopify.com'))({
          getApiSecret: () => 'secret',
        }),
      );

      expect(result).toBeInstanceOf(HmacError);
      expect(result).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('returns HmacError (INVALID_HMAC) for input with invalid "hmac" param', () => {
      const result = either.toUnion(
        verifyHmac(new URLSearchParams('shop=test.myshopify.com&hmac=xxx'))({
          getApiSecret: () => 'secret',
        }),
      );

      expect(result).toBeInstanceOf(HmacError);
      expect(result).toHaveProperty('code', 'INVALID_HMAC');
    });

    it('returns ShopOrigin for valid input', () => {
      const hmac = createHmac('secret', 'shop=test.myshopify.com');

      const result = verifyHmac(new URLSearchParams(`shop=test.myshopify.com&hmac=${hmac}`))({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates extra search parameters', () => {
      const hmac = createHmac('secret', 'extra=1&shop=test.myshopify.com');

      const result = verifyHmac(
        new URLSearchParams(`extra=1&shop=test.myshopify.com&hmac=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates unordered search parameters', () => {
      const hmac = createHmac('secret', 'extra=1&shop=test.myshopify.com');

      const result = verifyHmac(
        new URLSearchParams(`shop=test.myshopify.com&extra=1&hmac=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates parameters with special symbols (encoded)', () => {
      const hmac = createHmac('secret', '%25%26%3D=%25%26%2F&shop=test.myshopify.com');

      const result = verifyHmac(
        new URLSearchParams(`%25%26%3D=%25%26%2F&shop=test.myshopify.com&hmac=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates array search parameters', () => {
      const hmac = createHmac('secret', 'extra=["1", "2"]&shop=test.myshopify.com');

      const result = verifyHmac(
        new URLSearchParams(`extra=1&extra=2&shop=test.myshopify.com&hmac=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates bracket array search parameters', () => {
      const hmac = createHmac('secret', 'extra=["1", "2"]&shop=test.myshopify.com');

      const result = verifyHmac(
        new URLSearchParams(`extra[]=1&extra[]=2&shop=test.myshopify.com&hmac=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });
  });

  describe('verifySignature', () => {
    it('returns HmacError (INVALID_INPUT) for input with invalid "shop" param', () => {
      const result = either.toUnion(
        verifySignature(new URLSearchParams('shop=xxx'))({
          getApiSecret: () => 'secret',
        }),
      );

      expect(result).toBeInstanceOf(HmacError);
      expect(result).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('returns HmacError (INVALID_INPUT) for input without "signature" param', () => {
      const result = either.toUnion(
        verifySignature(new URLSearchParams('shop=test.myshopify.com'))({
          getApiSecret: () => 'secret',
        }),
      );

      expect(result).toBeInstanceOf(HmacError);
      expect(result).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('returns HmacError (INVALID_HMAC) for input with invalid "signature" param', () => {
      const result = either.toUnion(
        verifySignature(new URLSearchParams('shop=test.myshopify.com&signature=xxx'))({
          getApiSecret: () => 'secret',
        }),
      );

      expect(result).toBeInstanceOf(HmacError);
      expect(result).toHaveProperty('code', 'INVALID_HMAC');
    });

    it('returns ShopOrigin for valid input', () => {
      const hmac = createHmac('secret', 'shop=test.myshopify.com');

      const result = verifySignature(
        new URLSearchParams(`shop=test.myshopify.com&signature=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates extra search parameters', () => {
      const hmac = createHmac('secret', 'extra=1shop=test.myshopify.com');

      const result = verifySignature(
        new URLSearchParams(`extra=1&shop=test.myshopify.com&signature=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates unordered search parameters', () => {
      const hmac = createHmac('secret', 'extra=1shop=test.myshopify.com');

      const result = verifySignature(
        new URLSearchParams(`shop=test.myshopify.com&extra=1&signature=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates parameters with special symbols (decoded)', () => {
      const hmac = createHmac('secret', '%&==%&/shop=test.myshopify.com');

      const result = verifySignature(
        new URLSearchParams(`%25%26%3D=%25%26%2F&shop=test.myshopify.com&signature=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates array search parameters', () => {
      const hmac = createHmac('secret', 'extra=1,2shop=test.myshopify.com');

      const result = verifySignature(
        new URLSearchParams(`extra=1&extra=2&shop=test.myshopify.com&signature=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });

    it('validates bracket array search parameters', () => {
      const hmac = createHmac('secret', 'extra=1,2shop=test.myshopify.com');

      const result = verifySignature(
        new URLSearchParams(`extra[]=1&extra[]=2&shop=test.myshopify.com&signature=${hmac}`),
      )({
        getApiSecret: () => 'secret',
      });

      expect(result).toStrictEqual(either.right('test.myshopify.com'));
    });
  });
});
