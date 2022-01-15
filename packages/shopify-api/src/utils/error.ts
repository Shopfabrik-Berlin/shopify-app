export type NotFoundEntity = {
  id: string;
  name: string;
};

export class NotFoundError extends Error {
  static fromEntity(entity: NotFoundEntity): NotFoundError {
    const error = new NotFoundError(`${entity.name} ${entity.id} not found`);
    error.entity = entity;
    return error;
  }

  readonly status = 404;
  entity?: NotFoundEntity;

  constructor(message: string) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
  }
}
