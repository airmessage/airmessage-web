import {DependencyList, RefObject, useCallback, useEffect, useRef, useState} from "react";
import * as ConnectionManager from "shared/connection/connectionManager";

export function useBlobURL(data: BlobPart, type?: string): string | undefined {
	const [imageURL, setImageURL] = useState<string | undefined>(undefined);
	
	useEffect(() => {
		//Generating an image URL
		const imageURL = URL.createObjectURL(new Blob([data], {type: type}));
		
		//Creating a new image URL
		setImageURL(imageURL);
		
		//Cleaning up image URL
		return () => URL.revokeObjectURL(imageURL);
	}, [data, type, setImageURL]);
	
	return imageURL;
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

/**
 * Keeps track of whether FaceTime is supported by the connected server
 */
export function useIsFaceTimeSupported(): boolean {
	const [isFaceTimeSupported, setIsFaceTimeSupported] = useState(false);
	useEffect(() => {
		ConnectionManager.faceTimeSupportedEmitter.registerListener(setIsFaceTimeSupported);
		return () => ConnectionManager.faceTimeSupportedEmitter.unregisterListener(setIsFaceTimeSupported);
	}, [setIsFaceTimeSupported]);
	
	return isFaceTimeSupported;
}

/**
 * Binds the mounted state of the current function component to a reference to a boolean
 */
export function useIsUnmounted(): RefObject<boolean> {
	const isUnmounted = useRef(false);
	useEffect(() => {
		return () => {
			isUnmounted.current = true;
		};
	}, []);
	return isUnmounted;
}

/**
 * Returns a function that can be used to wrap a promise that will never resolve or reject
 * after the component is unmounted
 */
export function useUnmountedPromiseWrapper() {
	const isUnmounted = useIsUnmounted();
	
	return useCallback(<T>(promise: Promise<T>): Promise<T> => {
		return new Promise<T>((resolve, reject) => {
			promise.then((value) => {
				if(isUnmounted.current) return;
				resolve(value);
			}, (reason) => {
				if(isUnmounted.current) return;
				reject(reason);
			});
		});
	}, [isUnmounted]);
}