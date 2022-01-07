/**
 * https://stackoverflow.com/a/53187807
 *
 * Returns the index of the last element in the array where predicate is true, and -1
 * otherwise.
 * @param array The source array to search in
 * @param predicate find calls predicate once for each element of the array, in descending
 * order, until it finds one where predicate returns true. If such an element is found,
 * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
 */
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
	let l = array.length;
	while(l--) {
		if(predicate(array[l], l, array)) return l;
	}
	return -1;
}

/**
 * Returns the the last element in the array where predicate is true, and undefined
 * otherwise.
 * @param array The source array to search in
 * @param predicate find calls predicate once for each element of the array, in descending
 * order, until it finds one where predicate returns true. If such an element is found,
 * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
 */
export function findLast<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined {
	let l = array.length;
	let el: T;
	while(l--) {
		el = array[l];
		if(predicate(el, l, array)) return el;
	}
	return undefined;
}

/**
 * Checks if 2 arrays contain the same values
 * @param array1 The first array to compare
 * @param array2 The second array to compare
 * @param mapFn A function to apply that will map all values
 * @param compareFn A function used to compare two values
 */
export function arrayContainsAll<T>(array1: T[], array2: T[], mapFn: (a: T) => T = (a) => a, compareFn?: ((a: T, b: T) => number)): boolean {
	//Make sure the arrays have the same length
	if(array1.length !== array2.length) return false;
	
	//Map and sort the arrays
	const array1Sorted = array1.map(mapFn).sort(compareFn);
	const array2Sorted = array2.map(mapFn).sort(compareFn);
	
	//Return false if any of the elements don't match
	for(let i = 0; i < array1Sorted.length; i++) {
		if(compareFn !== undefined) {
			if(compareFn(array1Sorted[i], array2Sorted[i]) !== 0) {
				return false;
			}
		} else {
			if(array1Sorted[i] !== array2Sorted[i]) {
				return false;
			}
		}
	}
	
	return true;
}