export class DomainException extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class NotFoundException extends DomainException {
  constructor(entityName: string, id: string | number) {
    super(`${entityName} with identifier '${id}' was not found.`, 'NOT_FOUND', { entityName, id });
    this.name = 'NotFoundException';
  }
}
