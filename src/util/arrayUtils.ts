/**
 * Checks if 2 arrays contain the same values
 * @param array1 The first array to compare
 * @param array2 The second array to compare
 * @param mapFn A function to apply that will map all values
 * @param compareFn A function used to compare two values
 */
export function arrayContainsAll<T, R>(
  array1: T[],
  array2: T[],
  mapFn: (a: T) => R,
  compareFn?: (a: R, b: R) => number
): boolean;
export function arrayContainsAll<T>(
  array1: T[],
  array2: T[],
  mapFn?: undefined,
  compareFn?: (a: T, b: T) => number
): boolean;
export function arrayContainsAll(
  array1: unknown[],
  array2: unknown[],
  mapFn: (a: unknown) => unknown = (a) => a,
  compareFn?: (a: unknown, b: unknown) => number
): boolean {
  //Make sure the arrays have the same length
  if (array1.length !== array2.length) return false;

  //Map and sort the arrays
  const array1Sorted = array1.map(mapFn).sort(compareFn);
  const array2Sorted = array2.map(mapFn).sort(compareFn);

  //Return false if any of the elements don't match
  for (let i = 0; i < array1Sorted.length; i++) {
    if (compareFn !== undefined) {
      if (compareFn(array1Sorted[i], array2Sorted[i]) !== 0) {
        return false;
      }
    } else {
      if (array1Sorted[i] !== array2Sorted[i]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Creates a map of array entries grouped by a property
 */
export function groupArray<T, K>(
  array: T[],
  keyExtractor: (item: T) => K
): Map<K, T[]> {
  return array.reduce<Map<K, T[]>>((accumulator, item) => {
    const key = keyExtractor(item);

    const itemArray = accumulator.get(key);
    if (itemArray !== undefined) itemArray.push(item);
    else accumulator.set(key, [item]);
    return accumulator;
  }, new Map());
}
