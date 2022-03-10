export type FetchResponse = {
  status: number;
};

export class FetchError<R extends FetchResponse = FetchResponse> extends Error {
  readonly status: number;
  readonly response: R;

  constructor(message: string, response: R) {
    super(message);
    this.status = response.status;
    this.response = response;
    Object.defineProperty(this, 'name', { value: 'FetchError' });
  }
}

export class InvalidArgumentError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'InvalidArgumentError' });
  }
}
