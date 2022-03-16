import type { IncomingHttpHeaders } from 'http';
import { InvalidArgumentError } from './error';

export function get(headers: IncomingHttpHeaders, key: keyof IncomingHttpHeaders): string {
  const value = headers[key];

  if (!value || typeof value !== 'string') {
    throw new InvalidArgumentError(`Missing "${key}" header`);
  }

  return value;
}
