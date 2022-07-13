/**
 * Wraps a promise, and returns a new promise that rejects after the
 * specified amount of time
 * @param timeout The promise timeout in milliseconds
 * @param timeoutReason The reason to use when rejecting the promise
 * @param promise The promise to wrap
 */
export default function promiseTimeout<T>(
  timeout: number,
  timeoutReason: any | undefined,
  promise: Promise<T>
): Promise<T> {
  // Create a promise that rejects in <ms> milliseconds
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(timeoutReason);
    }, timeout);
  });

  return Promise.race<T>([promise, timeoutPromise]);
}
