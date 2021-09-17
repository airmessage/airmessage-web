/**
 * Runs an effect that can queue promises won't invoke callbacks once the effect is cleaned up
 */
import {DependencyList, useEffect} from "react";

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