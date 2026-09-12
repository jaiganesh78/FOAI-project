export class Result<T, E = Error> {
  private constructor(
    public readonly isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  public static ok<U>(value?: U): Result<U, never> {
    return new Result<U, never>(true, value, undefined);
  }

  public static fail<F>(error: F): Result<never, F> {
    return new Result<never, F>(false, undefined, error);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot retrieve value from a failed Result.');
    }
    return this._value as T;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot retrieve error from a successful Result.');
    }
    return this._error as E;
  }
}
