/* eslint-disable @typescript-eslint/no-explicit-any */

import type { UnionToIntersection } from 'type-fest';

export type RIO<R, I, O> = (env: R, input: I) => O;

export type InferEnv<T> = T extends RIO<infer R, any, any> ? R : never;
export type InferInput<T> = T extends RIO<any, infer I, any> ? I : never;
export type InferOutput<T> = T extends RIO<any, any, infer O> ? O : never;

export type RemoveEnv<T> = T extends RIO<any, infer I, infer O> ? (input: I) => O : never;
export type RemoveEnvS<S extends Record<PropertyKey, RIO<any, any, any>>> = {
  [K in keyof S]: RemoveEnv<S[K]>;
};

export type TypeFn<T> = T & {
  Env: InferEnv<T>;
  Input: InferInput<T>;
  Output: InferOutput<T>;
};

export function applyEnv<R, I, O>(rio: RIO<R, I, O>, env: R) {
  return (input: I): O => rio(env, input);
}

export function mapEnv<R1, R2, I, O>(rio: RIO<R2, I, O>, f: (env: R1) => R2): RIO<R1, I, O> {
  return (env, input) => rio(f(env), input);
}

export type SequenceEnv<S extends Record<PropertyKey, RIO<any, any, any>>> = (
  env: UnionToIntersection<InferEnv<S[keyof S]>>,
) => RemoveEnvS<S>;

export function sequenceEnv<S extends Record<PropertyKey, RIO<any, any, any>>>(
  struct: S,
): SequenceEnv<S> {
  return (env) => {
    return Object.fromEntries(
      Object.entries(struct).map(([key, rio]) => [key, applyEnv(rio, env)]),
    ) as never;
  };
}

export function map<R, I, O1, O2>(rio: RIO<R, I, O1>, f: (result: O1) => O2): RIO<R, I, O2> {
  return (env, input) => f(rio(env, input));
}
