import { either, json } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Decoder } from 'io-ts/Decoder';
import * as decoder from 'io-ts/Decoder';
import type { Guard } from 'io-ts/Guard';
import * as guard from 'io-ts/Guard';

// https://shopify.dev/themes/architecture/templates/json-templates

export type JsonTemplate = {
  // Shopify docs state that `name` is a required field, although in practice it is not
  readonly name?: string;
  readonly sections: Readonly<Record<string, JsonTemplateSection>>;
  readonly order: ReadonlyArray<string>;
};

export type JsonTemplateSection = {
  readonly type: string;
  readonly blocks?: Readonly<Record<string, JsonTemplateSectionBlock>>;
};

export type JsonTemplateSectionBlock = {
  readonly type: string;
};

const sectionBlockGuard: Guard<unknown, JsonTemplateSectionBlock> = guard.struct({
  type: guard.string,
});

const sectionGuard: Guard<unknown, JsonTemplateSection> = pipe(
  guard.struct({
    type: guard.string,
  }),
  guard.intersect(
    guard.partial({
      blocks: guard.record(sectionBlockGuard),
    }),
  ),
);

const _guard: Guard<unknown, JsonTemplate> = pipe(
  guard.struct({
    sections: guard.record(sectionGuard),
    order: guard.array(guard.string),
  }),
  guard.intersect(
    guard.partial({
      name: guard.string,
    }),
  ),
);

export { _guard as guard };

const _decoder: Decoder<unknown, JsonTemplate> = decoder.fromGuard(_guard, 'JsonTemplate');

export const templateContentDecoder: Decoder<string, JsonTemplate> = {
  decode: (templateContents) => {
    return pipe(
      json.parse(templateContents),
      either.mapLeft(() => decoder.error(templateContents, 'JSON template')),
      either.chain(_decoder.decode),
    );
  },
};
