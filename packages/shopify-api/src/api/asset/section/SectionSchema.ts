import { either, json } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Decoder } from 'io-ts/Decoder';
import * as decoder from 'io-ts/Decoder';
import type { Guard } from 'io-ts/Guard';
import * as guard from 'io-ts/Guard';

// https://shopify.dev/themes/architecture/sections/section-schema

export type SectionSchema = {
  readonly name: string;
  readonly blocks?: ReadonlyArray<SectionSchemaBlock>;
};

export type SectionSchemaBlock = {
  readonly type: string;
  readonly limit?: number;
  // Shopify docs state that `name` is a required field, although in practice it is not
  readonly name?: string;
};

const blockGuard: Guard<unknown, SectionSchemaBlock> = pipe(
  guard.struct({
    type: guard.string,
  }),
  guard.intersect(
    guard.partial({
      limit: guard.number,
      name: guard.string,
    }),
  ),
);

const _guard: Guard<unknown, SectionSchema> = pipe(
  guard.struct({
    name: guard.string,
  }),
  guard.intersect(
    guard.partial({
      blocks: guard.array(blockGuard),
    }),
  ),
);

export { _guard as guard };

const _decoder: Decoder<unknown, SectionSchema> = decoder.fromGuard(_guard, 'SectionSchema');

const SECTION_SCHEMA_RX = /\{%\s+schema\s+%\}([\s\S]*?)\{%\s+endschema\s+%\}/m;

export const sectionContentsDecoder: Decoder<string, SectionSchema> = {
  decode: (sectionContents) => {
    return pipe(
      either.fromNullable(decoder.error(sectionContents, 'section contents with schema'))(
        SECTION_SCHEMA_RX.exec(sectionContents)?.[1],
      ),
      either.chain((textSchema) => {
        return pipe(
          json.parse(textSchema),
          either.mapLeft(() => decoder.error(textSchema, 'JSON schema')),
        );
      }),
      either.chain(_decoder.decode),
    );
  },
};
