import { option, readerTaskEither } from 'fp-ts';
import { constFalse, pipe } from 'fp-ts/function';
import type { ClientRestPayload } from '../../../client/rest';
import type { Asset } from '../../asset';
import * as asset from '../../asset/Asset';
import type { SectionSchemaBlock } from './SectionSchema';
import * as sectionSchema from './SectionSchema';

export type SupportsAppBlocksInput = asset.FindInput;

export function supportsAppBlocks(input: SupportsAppBlocksInput): ClientRestPayload<boolean> {
  return pipe(
    asset.find(input),
    readerTaskEither.map(option.fold(constFalse, assetSupportsAppBlocks)),
  );
}

function assetSupportsAppBlocks(section: Asset): boolean {
  return pipe(
    option.fromPredicate(asset.withValueGuard.is)(section),
    option.chainEitherK((section) => sectionSchema.sectionContentsDecoder.decode(section.value)),
    option.fold(constFalse, (schema) => schema.blocks?.some(isAppBlockType) ?? false),
  );
}

const APP_BLOCK_TYPE = '@app';

function isAppBlockType(block: SectionSchemaBlock): boolean {
  return block.type === APP_BLOCK_TYPE;
}
