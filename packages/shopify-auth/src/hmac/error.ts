export class InvalidHmacError extends Error {
  constructor() {
    super('Invalid HMAC');
    Object.defineProperty(this, 'name', { value: 'InvalidHmacError' });
  }
}
