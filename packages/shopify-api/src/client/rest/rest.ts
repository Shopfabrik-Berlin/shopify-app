import { DataLoaderEnv, mkDataLoaderEnv } from '@dddenis/dataloader-fp';
import axios from 'axios';
import { deepmerge } from 'deepmerge-ts';
import { either, taskEither } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import { ClientRequest } from 'http';
import * as retry from 'retry-ts';
import { retrying } from 'retry-ts/Task';
import { mkMemoized } from '../../utils';
import type { RestRequestConfig } from './request';
import { RestRequestError } from './RestRequestError';

export interface ClientRestEnv extends DataLoaderEnv {
  readonly shopify: {
    readonly client: {
      readonly rest: <A, I = unknown, O = unknown>(
        config: RestRequestConfig<I>,
      ) => TaskEither<RestRequestError<I, O>, A>;
    };
  };
}

export type ClientRestPayload<A, I = unknown, O = unknown> = (
  env: ClientRestEnv,
) => TaskEither<RestRequestError<I, O>, A>;

const RETRY_POLICY = retry.Monoid.concat(retry.constantDelay(1000), retry.limitRetries(20));

export type ClientRestConfig = {
  readonly accessToken: string;
  readonly shopOrigin: string;
};

export function mkClientRestEnv(config: ClientRestConfig): ClientRestEnv {
  const getClient = mkMemoized(() => {
    return axios.create({
      baseURL: `https://${config.shopOrigin}/admin/api/2021-10/`,
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
      },
    });
  });

  return {
    ...mkDataLoaderEnv(),
    shopify: {
      client: {
        rest: <A, I = unknown, O = unknown>(config: RestRequestConfig<I>) => {
          const request = taskEither.tryCatch(
            () => getClient().request<A>(config),
            toRequestError<I, O>(config),
          );

          return pipe(
            retrying(RETRY_POLICY, () => request, shouldRetryRequest),
            taskEither.map((response) => response.data),
          );
        },
      },
    },
  };
}

function toRequestError<I, O>(config: RestRequestConfig<I>) {
  return (reason: unknown): RestRequestError<I, O> => {
    if (axios.isAxiosError(reason)) {
      return new RestRequestError<I, O>({
        message: reason.message,
        config: deepmerge(reason.config, config),
        request: reason.request instanceof ClientRequest ? reason.request : undefined,
        response: reason.response,
      });
    }

    if (reason instanceof Error) {
      return new RestRequestError({
        message: reason.message,
        config,
      });
    }

    return new RestRequestError({
      message: `Unknown request error: ${String(reason)}`,
      config,
    });
  };
}

const RETRY_STATUS_CODES = [408, 413, 429, 500, 502, 503, 504, 521, 522, 524];

function shouldRetryRequest(ma: Either<RestRequestError, unknown>): boolean {
  return (
    either.isLeft(ma) && !!ma.left.response && RETRY_STATUS_CODES.includes(ma.left.response.status)
  );
}
