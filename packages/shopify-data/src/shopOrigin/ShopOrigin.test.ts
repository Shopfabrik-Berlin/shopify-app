import * as fc from 'fast-check';
import { arbitrary } from './arbitrary';
import { is } from './ShopOrigin';

describe('ShopOrigin', () => {
  describe('is', () => {
    it('returns false when input is not a string', () => {
      fc.assert(
        fc.property(
          fc.anything().filter((x) => !(typeof x === 'string')),
          (x) => !is(x),
        ),
      );
    });

    it('returns false when first char is not alphanumeric', () => {
      fc.assert(
        fc.property(
          arbitrary(),
          fc.char().filter((x) => !/[a-zA-Z0-9]/.test(x)),
          (shopOrigin, x) => !is(x + shopOrigin),
        ),
      );
    });

    it('returns false when domain is not `*.myshopify.*`', () => {
      fc.assert(
        fc.property(
          arbitrary(),
          fc.string().filter((domain) => domain !== 'myshopify'),
          (shopOrigin, domain) => !is(shopOrigin.replace('myshopify', () => domain)),
        ),
      );
    });

    it('returns false when TLD is not `.com` or `.io`', () => {
      fc.assert(
        fc.property(
          arbitrary(),
          fc.string().filter((x) => !/(com|io)/.test(x)),
          (shopOrigin, tld) => !is(shopOrigin.replace(/(com|io)$/, () => tld)),
        ),
      );
    });

    it('returns true for valid shop origins', () => {
      fc.assert(fc.property(arbitrary(), is));
    });
  });
});
