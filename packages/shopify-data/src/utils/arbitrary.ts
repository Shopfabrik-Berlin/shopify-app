import * as fc from 'fast-check';

export type Map<A extends Readonly<Record<string, unknown>>> = {
  readonly [K in keyof A]-?: fc.Arbitrary<A[K]>;
};

// [a-z]
export const lowerCaseChar: fc.Arbitrary<string> = fc.mapToConstant({
  num: 26,
  build: (x) => String.fromCharCode(0x61 + x),
});

// [A-Z]
export const upperCaseChar: fc.Arbitrary<string> = fc.mapToConstant({
  num: 26,
  build: (x) => String.fromCharCode(0x41 + x),
});

// [0-9]
export const numericChar: fc.Arbitrary<string> = fc.mapToConstant({
  num: 10,
  build: (x) => String.fromCharCode(0x30 + x),
});

// [a-zA-Z0-9]
export const alphaNumericChar: fc.Arbitrary<string> = fc.frequency(
  { weight: 26, arbitrary: lowerCaseChar },
  { weight: 26, arbitrary: upperCaseChar },
  { weight: 10, arbitrary: numericChar },
);

// [a-zA-Z0-9-]
export const alphaNumericHyphenChar: fc.Arbitrary<string> = fc.frequency(
  { weight: 62, arbitrary: alphaNumericChar },
  { weight: 1, arbitrary: fc.constant('-') },
);

// [\w]
export const wordChar: fc.Arbitrary<string> = fc.frequency(
  { weight: 62, arbitrary: alphaNumericChar },
  { weight: 1, arbitrary: fc.constant('_') },
);

// [\w-]
export const wordHyphenChar: fc.Arbitrary<string> = fc.frequency(
  { weight: 63, arbitrary: wordChar },
  { weight: 1, arbitrary: fc.constant('-') },
);
