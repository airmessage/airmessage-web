import UnsubscribeCallback from "shared/data/unsubscribeCallback";

/**
 * Wraps a promise, returning the wrapped promise and a callback
 * that prevents the wrapped promise from receiving further updates
 * from the original promise
 */
export function makeCancellablePromise<T>(
  promise: Promise<T>
): [Promise<T>, UnsubscribeCallback] {
  let isCancelled = false;

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise
      .then((val) => {
        if (!isCancelled) {
          resolve(val);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          reject(error);
        }
      });
  });
  const cancelPromise = () => {
    isCancelled = true;
  };

  return [wrappedPromise, cancelPromise];
}

/**
 * Wraps a promise, passing a callback that prevents the wrapped promise
 * from receiving further updates to unsubscribeConsumer
 */
export function installCancellablePromise<T>(
  promise: Promise<T>,
  unsubscribeConsumer: (callback: UnsubscribeCallback) => void
): Promise<T> {
  const [wrappedPromise, unsubscribeCallback] = makeCancellablePromise(promise);
  unsubscribeConsumer(unsubscribeCallback);
  return wrappedPromise;
}
