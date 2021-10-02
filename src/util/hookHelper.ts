/**
 * Runs an effect that can queue promises won't invoke callbacks once the effect is cleaned up
 */
import {DependencyList, useCallback, useEffect, useState} from "react";

/**
 * Uses state for a set on / off boolean
 */
export function useBoolean(defaultValue?: boolean): [boolean, VoidFunction, VoidFunction] {
	const [value, setValue] = useState(defaultValue ?? false);
	const setFalse = useCallback(() => setValue(false), [setValue]);
	const setTrue = useCallback(() => setValue(true), [setValue]);
	return [value, setTrue, setFalse];
}

/**
 * Wrapper for useEffect, that passes a function that can wrap a promise
 * whose result will be ignored if it resolves after the component unmounts
 */
export function useCancellableEffect(
	effect: (
		addPromise: <T>(promise: Promise<T>) => Promise<T>
	) => void | VoidFunction,
	deps?: DependencyList
) {
	useEffect(() => {
		let isCancelled = false;
		
		const cleanup = effect(<T>(promise: Promise<T>): Promise<T> => {
			return new Promise<T>((resolve, reject) => {
				promise
					.then((val) => !isCancelled && resolve(val))
					.catch((error) => !isCancelled && reject(error));
			});
		});
		
		return () => {
			isCancelled = true;
			cleanup?.();
		};
	}, deps); //eslint-disable-line react-hooks/exhaustive-deps
}