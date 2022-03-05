import * as crypto from 'crypto';
import { URLSearchParams } from 'url';
import { InvalidArgumentError } from '../utils/error';
import { InvalidHmacError, verifyHmac, verifySignature } from './hmac';

const createHmac = (secret: string, payload: string): string => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

describe('hmac', () => {
  describe('verifyHmac', () => {
    it('throws InvalidArgumentError for input with invalid "shop" param', () => {
      const result = () =>
        verifyHmac({
          apiSecret: 'secret',
          searchParams: new URLSearchParams('shop=xxx'),
        });

      expect(result).toThrow(InvalidArgumentError);
    });

    it('throws InvalidArgumentError for input without "hmac" param', () => {
      const result = () =>
        verifyHmac({
          apiSecret: 'secret',
          searchParams: new URLSearchParams('shop=test.myshopify.com'),
        });

      expect(result).toThrow(InvalidArgumentError);
    });

    it('throws InvalidHmacError for input with invalid "hmac" param', () => {
      const result = () =>
        verifyHmac({
          apiSecret: 'secret',
          searchParams: new URLSearchParams('shop=test.myshopify.com&hmac=xxx'),
        });

      expect(result).toThrow(InvalidHmacError);
    });

    it('returns ShopOrigin for valid input', () => {
      const hmac = createHmac('secret', 'shop=test.myshopify.com');

      const result = verifyHmac({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(`shop=test.myshopify.com&hmac=${hmac}`),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates extra search parameters', () => {
      const hmac = createHmac('secret', 'extra=1&shop=test.myshopify.com');

      const result = verifyHmac({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(`extra=1&shop=test.myshopify.com&hmac=${hmac}`),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates unordered search parameters', () => {
      const hmac = createHmac('secret', 'extra=1&shop=test.myshopify.com');

      const result = verifyHmac({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(`shop=test.myshopify.com&extra=1&hmac=${hmac}`),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates parameters with special symbols (encoded)', () => {
      const hmac = createHmac('secret', '%25%26%3D=%25%26%2F&shop=test.myshopify.com');

      const result = verifyHmac({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(
          `%25%26%3D=%25%26%2F&shop=test.myshopify.com&hmac=${hmac}`,
        ),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates array search parameters', () => {
      const hmac = createHmac('secret', 'extra=["1", "2"]&shop=test.myshopify.com');

      const result = verifyHmac({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(`extra=1&extra=2&shop=test.myshopify.com&hmac=${hmac}`),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates bracket array search parameters', () => {
      const hmac = createHmac('secret', 'extra=["1", "2"]&shop=test.myshopify.com');

      const result = verifyHmac({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(
          `extra[]=1&extra[]=2&shop=test.myshopify.com&hmac=${hmac}`,
        ),
      });

      expect(result).toBe('test.myshopify.com');
    });
  });

  describe('verifySignature', () => {
    it('throws InvalidArgumentError for input with invalid "shop" param', () => {
      const result = () =>
        verifySignature({
          apiSecret: 'secret',
          searchParams: new URLSearchParams('shop=xxx'),
        });

      expect(result).toThrow(InvalidArgumentError);
    });

    it('throws InvalidArgumentError for input without "hmac" param', () => {
      const result = () =>
        verifySignature({
          apiSecret: 'secret',
          searchParams: new URLSearchParams('shop=test.myshopify.com'),
        });

      expect(result).toThrow(InvalidArgumentError);
    });

    it('throws InvalidHmacError for input with invalid "hmac" param', () => {
      const result = () =>
        verifySignature({
          apiSecret: 'secret',
          searchParams: new URLSearchParams('shop=test.myshopify.com&signature=xxx'),
        });

      expect(result).toThrow(InvalidHmacError);
    });

    it('returns ShopOrigin for valid input', () => {
      const hmac = createHmac('secret', 'shop=test.myshopify.com');

      const result = verifySignature({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(`shop=test.myshopify.com&signature=${hmac}`),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates extra search parameters', () => {
      const hmac = createHmac('secret', 'extra=1shop=test.myshopify.com');

      const result = verifySignature({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(`extra=1&shop=test.myshopify.com&signature=${hmac}`),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates unordered search parameters', () => {
      const hmac = createHmac('secret', 'extra=1shop=test.myshopify.com');

      const result = verifySignature({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(`shop=test.myshopify.com&extra=1&signature=${hmac}`),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates parameters with special symbols (decoded)', () => {
      const hmac = createHmac('secret', '%&==%&/shop=test.myshopify.com');

      const result = verifySignature({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(
          `%25%26%3D=%25%26%2F&shop=test.myshopify.com&signature=${hmac}`,
        ),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates array search parameters', () => {
      const hmac = createHmac('secret', 'extra=1,2shop=test.myshopify.com');

      const result = verifySignature({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(
          `extra=1&extra=2&shop=test.myshopify.com&signature=${hmac}`,
        ),
      });

      expect(result).toBe('test.myshopify.com');
    });

    it('validates bracket array search parameters', () => {
      const hmac = createHmac('secret', 'extra=1,2shop=test.myshopify.com');

      const result = verifySignature({
        apiSecret: 'secret',
        searchParams: new URLSearchParams(
          `extra[]=1&extra[]=2&shop=test.myshopify.com&signature=${hmac}`,
        ),
      });

      expect(result).toBe('test.myshopify.com');
    });
  });
});
