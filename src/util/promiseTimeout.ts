export default function promiseTimeout<T>(timeout: number, timeoutReason: any | undefined, promise: Promise<T>): Promise<T> {
	// Create a promise that rejects in <ms> milliseconds
	const timeoutPromise = new Promise<T>((resolve, reject) => {
		const id = setTimeout(() => {
			clearTimeout(id);
			reject(timeoutReason);
		}, timeout);
	});
	
	return Promise.race<T>([promise, timeoutPromise]);
}