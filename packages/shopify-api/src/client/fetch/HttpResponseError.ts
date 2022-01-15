import type { Response } from './fetch';

export class HttpResponseError<R extends Response = Response> extends Error {
  static is<R extends Response>(x: unknown): x is HttpResponseError<R> {
    return x instanceof HttpResponseError;
  }

  readonly status: number;
  readonly url?: string;
  readonly response: R;

  constructor(response: R) {
    super(`${response.status} ${response.url || '<unknown url>'}`);
    this.status = response.status;
    this.url = response.url;
    this.response = response;
    Object.defineProperty(this, 'name', { value: 'HttpResponseError' });
  }
}
