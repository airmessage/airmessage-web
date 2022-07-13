/**
 * A promise wrapper that can be resolved or rejected from outside the object
 */
import ResolveablePromise from "shared/util/resolveablePromise";

/**
 * A ResolveablePromise that can also be set to time out with a specified error
 */
export default class ResolveablePromiseTimeout<
  T
> extends ResolveablePromise<T> {
  private timeoutID: any | undefined = undefined;

  /**
   * Sets this promise to time out after duration with reason
   */
  timeout(duration: number, reason?: any): void {
    //Clear any existing timeouts
    if (this.timeoutID !== undefined) {
      clearTimeout(this.timeoutID);
    }

    //Set the timeout
    this.timeoutID = setTimeout(() => {
      this.reject(reason);
    }, duration);
  }

  /**
   * Clears the current timeout on this promise
   */
  clearTimeout() {
    //Ignore if there is no timeout
    if (this.timeoutID === undefined) return;

    //Cancel the timeout
    clearTimeout(this.timeoutID);
    this.timeoutID = undefined;
  }

  resolve(value: PromiseLike<T> | T) {
    clearTimeout();
    super.resolve(value);
  }

  reject(reason?: any) {
    clearTimeout();
    super.reject(reason);
  }
}
