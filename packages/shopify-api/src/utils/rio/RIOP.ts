/* eslint-disable @typescript-eslint/no-explicit-any */

import * as rio from './RIO';

export type RIOP<R, I, O> = rio.RIO<R, I, Promise<O>>;

export type InferOutput<T> = T extends RIOP<any, any, infer O> ? O : never;

export type TypeFn<T> = T & {
  Env: rio.InferEnv<T>;
  Input: rio.InferInput<T>;
  Output: InferOutput<T>;
};

export function map<R, I, O1, O2>(riop: RIOP<R, I, O1>, f: (result: O1) => O2): RIOP<R, I, O2> {
  return rio.map(riop, (result) => result.then(f));
}
