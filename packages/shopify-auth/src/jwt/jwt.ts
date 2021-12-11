export { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
export type { JwtPayload, VerifyErrors } from 'jsonwebtoken';

import type { ShopOrigin } from '@shopfabrik/shopify-data';
import { option, taskEither } from 'fp-ts';
import type { Option } from 'fp-ts/Option';
import type { TaskEither } from 'fp-ts/TaskEither';
import * as jwt from 'jsonwebtoken';
import type { ApiCredentials } from '../apiCredentials';

export function decode(token: string): Option<jwt.JwtPayload> {
  try {
    return option.fromNullable(jwt.decode(token, { json: true }));
  } catch {
    return option.none;
  }
}

export type SignPayload = Readonly<Record<string, unknown>> & {
  readonly shopOrigin: ShopOrigin;
};

export type SignOptions = Omit<jwt.SignOptions, 'algorithm' | 'audience'>;

const ALGORITHM = 'HS256';

export function sign({ shopOrigin, ...payload }: SignPayload, options?: SignOptions) {
  return (credentials: ApiCredentials): TaskEither<Error, string> => {
    return taskEither.taskify((callback: jwt.SignCallback) => {
      return jwt.sign(
        {
          ...payload,
          dest: `https://${shopOrigin}`,
        },
        credentials.secret,
        {
          ...options,
          algorithm: ALGORITHM,
          audience: credentials.key,
        },
        callback,
      );
    })();
  };
}

export function verify(token: string) {
  return (credentials: ApiCredentials): TaskEither<jwt.VerifyErrors, jwt.JwtPayload> => {
    return taskEither.taskify((callback: jwt.VerifyCallback) => {
      return jwt.verify(
        token,
        credentials.secret,
        {
          algorithms: [ALGORITHM],
          audience: credentials.key,
        },
        callback,
      );
    })();
  };
}
