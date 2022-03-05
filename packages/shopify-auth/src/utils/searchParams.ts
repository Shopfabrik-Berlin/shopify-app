import type { URLSearchParams } from 'url';
import { InvalidArgumentError } from './error';

export function get(searchParams: URLSearchParams, key: string): string {
  const value = searchParams.get(key);

  if (!value) {
    throw new InvalidArgumentError(`Missing "${key}" query param`);
  }

  return value;
}
