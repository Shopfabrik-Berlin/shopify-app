import * as crypto from 'crypto';

export type IsValidPayloadInput = {
  hmac: Buffer;
  payload: crypto.BinaryLike;
  secret: string;
};

export function isValidPayload(input: IsValidPayloadInput): boolean {
  try {
    const validHmac = crypto.createHmac('sha256', input.secret).update(input.payload).digest();
    return crypto.timingSafeEqual(validHmac, input.hmac);
  } catch {
    return false;
  }
}
