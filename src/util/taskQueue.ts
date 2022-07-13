/**
 * TaskQueue enqueues promises, ensuring that all promises
 * complete in the order they were enqueued in
 */
export default class TaskQueue {
  private previousTask: Promise<unknown> | undefined;

  /**
   * Enqueues a new promise.
   * The generator is only called when the previous promise in the queue completes.
   * The returned promise completes when itself and all of the promises before it have completed.
   */
  public enqueue(value: () => Promise<unknown>): void {
    if (this.previousTask === undefined) {
      this.previousTask = value();
    } else {
      this.previousTask = this.previousTask.then(value);
    }
  }
}
