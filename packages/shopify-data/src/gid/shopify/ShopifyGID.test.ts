import * as fc from 'fast-check';
import { GID, InvalidGidError } from '../GID';
import { arbitraryWithParts } from './arbitrary';
import { unsafeEncode } from './ShopifyGID';

describe('GID', () => {
  describe('ShopifyGID', () => {
    describe('unsafeEncode', () => {
      it('throws InvalidGidError for invalid input', () => {
        const test = (): GID => unsafeEncode('y')('!');
        expect(test).toThrow(InvalidGidError);
        expect(test).toThrow('gid://shopify/y/!');
      });

      it('encodes valid input', () => {
        fc.assert(
          fc.property(arbitraryWithParts(), ([gid, parts]) => {
            return (
              gid.startsWith('gid://shopify') &&
              unsafeEncode(parts.type)(parts.id, parts.params) === gid
            );
          }),
        );
      });
    });
  });
});
