import type { FetchFn, Response } from './fetch';
import { HttpResponseError } from './HttpResponseError';

const RETRY_STATUS_CODES = [408, 413, 429, 500, 502, 503, 504, 521, 522, 524];

const retryCheck: RetryCheckFn<Response> = (response, retryCount) => {
  if (!RETRY_STATUS_CODES.includes(response.status)) {
    return;
  }

  if (retryCount > 10) {
    throw new HttpResponseError(response);
  }

  return 1000;
};

export function retry<F extends FetchFn>(fetch: F): F {
  return (async (...args) => {
    return retryAsync(() => fetch(...args), retryCheck);
  }) as F;
}

type RetryCheckFn<T> = (result: T, retryCount: number) => number | undefined;

async function retryAsync<T>(f: () => Promise<T>, check: RetryCheckFn<T>): Promise<T> {
  let result: T;
  let retryCount = 0;

  for (;;) {
    result = await f();
    const delayMs = check(result, ++retryCount);
    if (typeof delayMs !== 'number') {
      break;
    }
    await delay(delayMs);
  }

  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
