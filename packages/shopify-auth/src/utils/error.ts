export class InvalidArgumentError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'InvalidArgumentError' });
  }
}
