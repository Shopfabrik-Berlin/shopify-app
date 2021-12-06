import * as fc from 'fast-check';
import { arbitrary, arbitraryWithParts } from './arbitrary';
import { getId, GID, InvalidGidError, is, unsafeEncode } from './GID';

describe('GID', () => {
  describe('is', () => {
    it('returns false when input is not a string', () => {
      fc.assert(
        fc.property(
          fc.anything().filter((x) => !(typeof x === 'string')),
          (x) => !is(x),
        ),
      );
    });

    it('returns false when input does not start with `gid://`', () => {
      fc.assert(
        fc.property(
          arbitrary(),
          fc.string().filter((x) => x !== 'gid://'),
          (gid, schema) => !is(gid.replace(/^gid:\/\//, () => schema)),
        ),
      );
    });

    it('returns true for valid GID', () => {
      fc.assert(fc.property(arbitrary(), is));
    });
  });

  describe('getId', () => {
    it('returns id part of GID', () => {
      fc.assert(fc.property(arbitraryWithParts(), ([gid, parts]) => getId(gid) === parts.id));
    });
  });

  describe('unsafeEncode', () => {
    it('throws InvalidGidError for invalid input', () => {
      const test = (): GID => unsafeEncode('x')('y')('!');
      expect(test).toThrow(InvalidGidError);
      expect(test).toThrow('gid://x/y/!');
    });

    it('encodes valid input', () => {
      fc.assert(
        fc.property(arbitraryWithParts(), ([gid, parts]) => {
          return unsafeEncode(parts.namespace)(parts.type)(parts.id, parts.params) === gid;
        }),
      );
    });
  });
});
