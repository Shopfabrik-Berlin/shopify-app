import { either, option } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import { constNull, pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import type { ClientRequest } from 'http';
import type { RestRequestConfig, RestResponse } from './request';

export type RestRequestErrorConfig<I, O> = {
  readonly message: string;
  readonly config: RestRequestConfig<I>;
  readonly request?: ClientRequest;
  readonly response?: RestResponse<O>;
};

export class RestRequestError<I = unknown, O = unknown> extends Error {
  readonly config: RestRequestConfig<I>;
  readonly request?: ClientRequest;
  readonly response?: RestResponse<O>;

  constructor(config: RestRequestErrorConfig<I, O>) {
    super(config.message);

    this.config = config.config;
    this.request = config.request;
    this.response = config.response;
  }
}

export function isStatus(status: number) {
  return (error: RestRequestError): boolean => error.response?.status === status;
}

export function leftTo<E extends RestRequestError, B>(onMatch: (error: E) => B) {
  return (predicate: (error: E) => boolean): (<A>(ma: Either<E, A>) => Either<E, A | B>) => {
    return either.orElseW((error) =>
      predicate(error) ? either.right(onMatch(error)) : either.left(error),
    );
  };
}

export const leftToNullable: <E extends RestRequestError>(
  predicate: (error: E) => boolean,
) => <A>(ma: Either<E, A>) => Either<E, A | null> = leftTo(constNull);

export function leftToOption<E extends RestRequestError>(predicate: (error: E) => boolean) {
  return <A>(ma: Either<E, A>): Either<E, Option<A>> => {
    return pipe(leftToNullable(predicate)(ma), either.map(option.fromNullable));
  };
}
