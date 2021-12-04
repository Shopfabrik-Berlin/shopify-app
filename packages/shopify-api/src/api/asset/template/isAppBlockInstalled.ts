import type { GID } from '@shopfabrik/gid';
import { option, readerTaskEither, readonlyArray } from 'fp-ts';
import { constFalse, pipe } from 'fp-ts/function';
import type { ClientRestPayload } from '../../../client/rest';
import * as asset from '../../asset/Asset';
import type { Asset } from '../Asset';
import * as jsonTemplate from './JsonTemplate';

export type IsAppBlockInstalledInput = {
  readonly themeId: GID;
  readonly templateName: string;
  readonly blockName: string;
};

export function isAppBlockInstalled(input: IsAppBlockInstalledInput): ClientRestPayload<boolean> {
  return pipe(
    asset.find({
      themeId: input.themeId,
      key: `templates/${input.templateName}.json`,
    }),
    readerTaskEither.map(
      option.fold(constFalse, (template) => {
        return isAssetAppBlockInstalled({
          template,
          blockName: input.blockName,
        });
      }),
    ),
  );
}

type IsAssetAppBlockInstalledInput = {
  readonly template: Asset;
  readonly blockName: string;
};

function isAssetAppBlockInstalled(input: IsAssetAppBlockInstalledInput): boolean {
  return pipe(
    option.fromPredicate(asset.withValueGuard.is)(input.template),
    option.chainEitherK((template) => jsonTemplate.templateContentDecoder.decode(template.value)),
    option.fold(constFalse, (jsonTemplate) => {
      const appBlockRx = mkAppBlockRx(input.blockName);

      return pipe(
        Object.values(jsonTemplate.sections),
        readonlyArray.chain((templateSection) => Object.values(templateSection.blocks || {})),
        readonlyArray.some((sectionBlock) => appBlockRx.test(sectionBlock.type)),
      );
    }),
  );
}

function mkAppBlockRx(blockName: string): RegExp {
  return new RegExp(`^shopify://apps/.+?/blocks/${blockName}`);
}
