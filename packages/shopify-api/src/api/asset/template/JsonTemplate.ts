import * as s from 'superstruct';

// https://shopify.dev/themes/architecture/templates/json-templates

export type JsonTemplateSectionBlock = s.Infer<ReturnType<typeof sectionBlockStruct>>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const sectionBlockStruct = () => {
  return s.object({
    type: s.string(),
  });
};

export type JsonTemplateSection = s.Infer<ReturnType<typeof sectionStruct>>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const sectionStruct = () => {
  return s.object({
    type: s.string(),
    blocks: s.optional(s.record(s.string(), sectionBlockStruct())),
  });
};

export type JsonTemplate = s.Infer<ReturnType<typeof struct>>;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const struct = () => {
  return s.object({
    name: s.optional(s.string()),
    sections: s.record(s.string(), sectionStruct()),
    order: s.array(s.string()),
  });
};

export function decodeContent(contents: string): JsonTemplate | null {
  try {
    const jsonTemplate = JSON.parse(contents) as unknown;
    return s.mask(jsonTemplate, struct());
  } catch {
    return null;
  }
}
