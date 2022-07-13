/**
 * A promise wrapper that can be resolved or rejected from outside the object
 */
export default class ResolveablePromise<T> {
  public readonly promise: Promise<T>;
  private promiseResolve!: (value: T | PromiseLike<T>) => void;
  private promiseReject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.promiseResolve = resolve;
      this.promiseReject = reject;
    });
  }

  resolve(value: T | PromiseLike<T>): void {
    this.promiseResolve(value);
  }

  reject(reason?: any): void {
    this.promiseReject(reason);
  }
}
