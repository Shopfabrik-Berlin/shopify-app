import type { DocumentNode, OperationTypeNode } from 'graphql';

export type OperationContext = {
  type: OperationTypeNode;
  name: string;
};

export function getOperationContext(document: DocumentNode): OperationContext {
  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition') {
      return {
        type: definition.operation,
        name: definition.name?.value || '<no name>',
      };
    }
  }

  throw new Error('Invalid GraphQL DocumentNode');
}
