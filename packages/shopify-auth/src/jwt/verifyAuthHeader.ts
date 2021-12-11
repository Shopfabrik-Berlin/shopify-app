import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import { either, readerTaskEither, taskEither } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { TaskEither } from 'fp-ts/TaskEither';
import { URL } from 'url';
import * as jwt from './jwt';

export type VerifyAuthHeaderEnv = {
  readonly getApiSecret: (decodedToken: DecodedToken) => string;
};

export type DecodedToken = {
  readonly payload: ShopifyJwtPayload;
  readonly shopOrigin: ShopOrigin;
};

export type ShopifyJwtPayload = jwt.JwtPayload & {
  readonly aud: string;
  readonly dest: string;
};

export function verifyAuthHeader(
  header?: string,
): ReaderTaskEither<VerifyAuthHeaderEnv, jwt.VerifyErrors, DecodedToken> {
  return pipe(
    readerTaskEither.fromEither(parseTokenFromHeader(header)),
    readerTaskEither.chain(verifyToken),
  );
}

const AUTH_HEADER_RX = /^bearer (.+)/i;

function parseTokenFromHeader(header?: string): Either<jwt.JsonWebTokenError, string> {
  if (!header) {
    return either.left(new jwt.JsonWebTokenError('missing Authorization header'));
  }

  const token = AUTH_HEADER_RX.exec(header)?.[1];
  if (!token) {
    return either.left(new jwt.JsonWebTokenError(`invalid Authorization header: ${header}`));
  }

  return either.right(token);
}

function verifyToken(token: string) {
  return (env: VerifyAuthHeaderEnv): TaskEither<jwt.VerifyErrors, DecodedToken> => {
    return pipe(
      jwt.decode(token),
      taskEither.fromOption(() => new jwt.JsonWebTokenError('jwt token could not be decoded')),
      taskEither.chainEitherK(mkDecodedToken),
      taskEither.chainFirst((decodedToken) => {
        return jwt.verify(token)({
          key: decodedToken.payload.aud,
          secret: env.getApiSecret(decodedToken),
        });
      }),
    );
  };
}

function mkDecodedToken(payload: jwt.JwtPayload): Either<jwt.JsonWebTokenError, DecodedToken> {
  return pipe(
    parseShopifyJwtPayload(payload),
    either.chain((shopifyPayload) => {
      return pipe(
        parseShopOriginFromDest(shopifyPayload.dest),
        either.map((shopOrigin) => ({
          payload: shopifyPayload,
          shopOrigin,
        })),
      );
    }),
  );
}

function parseShopifyJwtPayload(
  payload: jwt.JwtPayload,
): Either<jwt.JsonWebTokenError, ShopifyJwtPayload> {
  if (typeof payload.aud !== 'string') {
    return either.left(
      new jwt.JsonWebTokenError(`invalid "aud" field in payload: ${String(payload.aud)}`),
    );
  }

  if (typeof payload.dest !== 'string') {
    return either.left(
      new jwt.JsonWebTokenError(`invalid "dest" field in payload: ${String(payload.dest)}`),
    );
  }

  return either.right({
    ...payload,
    aud: payload.aud,
    dest: payload.dest,
  });
}

function parseShopOriginFromDest(dest: string): Either<jwt.JsonWebTokenError, ShopOrigin> {
  try {
    const url = new URL(dest);

    if (shopOrigin.is(url.hostname)) {
      return either.right(url.hostname);
    }
  } catch {
    // noop
  }

  return either.left(new jwt.JsonWebTokenError('invalid shop origin in "dest" field'));
}
