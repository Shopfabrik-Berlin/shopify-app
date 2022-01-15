export type PaginationConnection<A> = {
  readonly edges: readonly PaginationEdge<A>[];
  readonly pageInfo?: PageInfo;
};

export type PaginationEdge<A> = {
  readonly cursor?: string;
  readonly node: A;
};

export type PageInfo = {
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
};

export function nodesFromConnection<A>({ edges }: PaginationConnection<A>): A[] {
  return edges.map(({ node }) => node);
}
