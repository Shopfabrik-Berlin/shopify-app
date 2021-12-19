import type { GID } from '@shopfabrik/shopify-data';
import { graphql, GraphQLHandler, GraphQLRequest } from 'msw';
import type {
  ScriptTagDeleteMutation,
  ScriptTagDeleteMutationVariables,
} from './scriptTagDelete.generated';
import type { ScriptTagsQueryVariables } from './scriptTags.generated';

export function mockRight(
  deletedScriptTagId: GID,
): GraphQLHandler<GraphQLRequest<ScriptTagsQueryVariables>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return graphql.mutation<ScriptTagDeleteMutation, ScriptTagDeleteMutationVariables>(
    'scriptTagDelete',
    (_req, res, ctx) => {
      return res(
        ctx.data({
          scriptTagDelete: {
            deletedScriptTagId,
            userErrors: [],
          },
        }),
      );
    },
  );
}
