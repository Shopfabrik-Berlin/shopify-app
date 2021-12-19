import { graphql, GraphQLHandler, GraphQLRequest } from 'msw';
import type { ScriptTag } from '../../schema.generated';
import type {
  ScriptTagCreateMutation,
  ScriptTagCreateMutationVariables,
} from './scriptTagCreate.generated';
import type { ScriptTagsQueryVariables } from './scriptTags.generated';

export function mockRight<A extends Partial<ScriptTag>>(
  scriptTag: A,
): GraphQLHandler<GraphQLRequest<ScriptTagsQueryVariables>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return graphql.mutation<ScriptTagCreateMutation<A>, ScriptTagCreateMutationVariables>(
    'scriptTagCreate',
    (req, res, ctx) => {
      return res(
        ctx.data({
          scriptTagCreate: {
            scriptTag: {
              ...req.variables.input,
              ...scriptTag,
            },
            userErrors: [],
          },
        }),
      );
    },
  );
}
