import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import { URL } from 'url';
import * as jwt from './jwt';

export type VerifyAuthHeaderInput = {
  getApiSecret: (decodedToken: DecodedToken) => string;
  header?: string;
};

export type DecodedToken = {
  payload: ShopifyJwtPayload;
  shopOrigin: ShopOrigin;
};

export type ShopifyJwtPayload = jwt.JwtPayload & {
  aud: string;
  dest: string;
};

export async function verifyAuthHeader(input: VerifyAuthHeaderInput): Promise<DecodedToken> {
  const token = parseToken(input.header);
  const payload = jwt.decode(token);
  if (!payload) {
    throw new jwt.JsonWebTokenError('jwt token could not be decoded');
  }

  const decodedToken = decodeToken(payload);
  await jwt.verify(
    {
      key: decodedToken.payload.aud,
      secret: input.getApiSecret(decodedToken),
    },
    token,
  );

  return decodedToken;
}

const AUTH_HEADER_RX = /^bearer (.+)/i;

function parseToken(header?: string): string {
  if (!header) {
    throw new jwt.JsonWebTokenError('missing Authorization header');
  }

  const token = AUTH_HEADER_RX.exec(header)?.[1];
  if (!token) {
    throw new jwt.JsonWebTokenError(`invalid Authorization header: ${header}`);
  }

  return token;
}

function decodeToken(payload: jwt.JwtPayload): DecodedToken {
  const shopifyPayload = parseShopifyJwtPayload(payload);
  const shopOrigin = parseShopOrigin(shopifyPayload.dest);

  return {
    payload: shopifyPayload,
    shopOrigin,
  };
}

function parseShopifyJwtPayload(payload: jwt.JwtPayload): ShopifyJwtPayload {
  if (typeof payload.aud !== 'string') {
    throw new jwt.JsonWebTokenError(`invalid "aud" field in payload: ${String(payload.aud)}`);
  }

  if (typeof payload.dest !== 'string') {
    throw new jwt.JsonWebTokenError(`invalid "dest" field in payload: ${String(payload.dest)}`);
  }

  return {
    ...payload,
    aud: payload.aud,
    dest: payload.dest,
  };
}

function parseShopOrigin(dest: string): ShopOrigin {
  try {
    const url = new URL(dest);

    if (shopOrigin.is(url.hostname)) {
      return url.hostname;
    }
  } catch {
    // noop
  }

  throw new jwt.JsonWebTokenError('invalid shop origin in "dest" field');
}
