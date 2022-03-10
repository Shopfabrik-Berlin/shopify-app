export type Response = {
  status: number;
  url?: string;
};

export class HttpResponseError<R extends Response = Response> extends Error {
  static is<R extends Response>(x: unknown): x is HttpResponseError<R> {
    return x instanceof HttpResponseError;
  }

  readonly status: number;
  readonly url?: string;
  readonly response: R;

  constructor(message: string, response: R) {
    super(`${message}: ${response.status} ${response.url || '<unknown url>'}`);
    this.status = response.status;
    this.url = response.url;
    this.response = response;
    Object.defineProperty(this, 'name', { value: 'HttpResponseError' });
  }
}

export class InvalidArgumentError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'InvalidArgumentError' });
  }
}
