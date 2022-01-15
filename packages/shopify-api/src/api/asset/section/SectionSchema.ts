import * as s from 'superstruct';

// https://shopify.dev/themes/architecture/sections/section-schema

export type SectionSchemaBlock = s.Infer<ReturnType<typeof blockStruct>>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const blockStruct = () => {
  return s.object({
    type: s.string(),
    limit: s.optional(s.number()),
    name: s.optional(s.string()),
  });
};

export type SectionSchema = s.Infer<ReturnType<typeof struct>>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const struct = () => {
  return s.object({
    name: s.string(),
    blocks: s.optional(s.array(blockStruct())),
  });
};

const SECTION_SCHEMA_RX = /\{%\s+schema\s+%\}([\s\S]*?)\{%\s+endschema\s+%\}/m;

export function decodeContents(contents: string): SectionSchema | null {
  const textSchema = SECTION_SCHEMA_RX.exec(contents)?.[1];
  if (!textSchema) {
    return null;
  }

  try {
    const sectionSchema = JSON.parse(textSchema) as unknown;
    return s.mask(sectionSchema, struct());
  } catch {
    return null;
  }
}
