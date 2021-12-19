import { graphql, GraphQLHandler, GraphQLRequest } from 'msw';
import type { ScriptTag } from '../../schema.generated';
import type { ScriptTagsQuery, ScriptTagsQueryVariables } from './scriptTags.generated';

export function mockConnection<A extends Partial<ScriptTag>>(
  scriptTags: ReadonlyArray<A>,
): GraphQLHandler<GraphQLRequest<ScriptTagsQueryVariables>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return graphql.query<ScriptTagsQuery<A>, ScriptTagsQueryVariables>(
    'scriptTags',
    (_req, res, ctx) => {
      return res(
        ctx.data({
          scriptTags: {
            edges: scriptTags.map((scriptTag) => {
              return {
                cursor: scriptTag.id || '',
                node: scriptTag,
              };
            }),
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        }),
      );
    },
  );
}
