import {arrayContainsAll, groupArray} from "../../src/util/arrayUtils";

type ValueHolder<T> = {value: T};
type KeyValueHolder<K, V> = {key: K, value: V};

function compareTypes(a: unknown, b: unknown): number {
	const typeA = typeof a;
	const typeB = typeof b;
	
	if(typeA < typeB) return -1;
	else if(typeA > typeB) return 1;
	else return 0;
}

describe("arrayContainsAll", () => {
	test("empty arrays should match", () => {
		const array: unknown[] = [];
		expect(arrayContainsAll(array, array)).toBe(true);
	});
	
	test("matching arrays should match", () => {
		const array = [0, 1, "string", undefined, null];
		expect(arrayContainsAll(array, array)).toBe(true);
	});
	
	test("matching arrays in different order should match", () => {
		const array1 = [0, 1, "string", undefined, null];
		const array2 = [...array1].reverse();
		expect(arrayContainsAll(array1, array2)).toBe(true);
	});
	
	test("matching arrays with a custom mapper should match", () => {
		const array1 = [0, 1, "string", undefined, null].map((it): ValueHolder<unknown> => ({value: it}));
		const array2 = [...array1].reverse();
		expect(arrayContainsAll(array1, array2, (it) => it.value)).toBe(true);
	});
	
	test("matching arrays with a custom matcher should match", () => {
		const array1 = [0, "1", 2];
		const array2 = ["3", 4, 5];
		expect(arrayContainsAll(array1, array2, undefined, compareTypes)).toBe(true);
	});
	
	test("arrays of differing lengths should not match", () => {
		const array1 = [0, 1, "string", undefined, null];
		const array2 = [0, 1, "string", undefined, null, null];
		expect(arrayContainsAll(array1, array2)).toBe(false);
	});
	
	test("arrays of differing values should not match", () => {
		const array1 = [0, 1, "string", undefined, null];
		const array2 = [0, 1, 2, undefined, null];
		expect(arrayContainsAll(array1, array2)).toBe(false);
	});
	
	test("arrays of differing values with a custom mapper should not match", () => {
		const array1 = [0, 1, "string", undefined, null].map((it): ValueHolder<unknown> => ({value: it}));
		const array2 = [0, 1, 2, undefined, null].map((it): ValueHolder<unknown> => ({value: it}));
		expect(arrayContainsAll(array1, array2, (it) => it.value)).toBe(false);
	});
	
	test("non-matching arrays with a custom matcher should not match", () => {
		const array1 = [0, 1, 2];
		const array2 = ["3", 4, 5];
		expect(arrayContainsAll(array1, array2, undefined, compareTypes)).toBe(false);
	});
});

describe("groupArray", () => {
	test("an empty array should produce an empty map", () => {
		expect(groupArray([], () => undefined).size).toBe(0);
	});
	
	test("a map with proper keys should be produced", () => {
		const redThings = ["apple", "lava", "ruby"].map((it): KeyValueHolder<string, string> => ({key: "red", value: it}));
		const greenThings = ["grass", "leaf"].map((it): KeyValueHolder<string, string> => ({key: "green", value: it}));
		const blueThings = ["water"].map((it): KeyValueHolder<string, string> => ({key: "blue", value: it}));
		
		const array = [...redThings, ...greenThings, ...blueThings];
		
		const groupedMap = groupArray(array, (it) => it.key);
		
		expect(groupedMap.get("red")).toEqual(expect.arrayContaining(redThings));
		expect(groupedMap.get("green")).toEqual(expect.arrayContaining(greenThings));
		expect(groupedMap.get("blue")).toEqual(expect.arrayContaining(blueThings));
	});
});