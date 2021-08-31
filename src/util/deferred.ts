/**
 * A class that contains a promise, as well as
 * function to resolve or reject it from any context
 */
export class Deferred<T> {
	public promise: Promise<T>;
	public resolve!: ((value: T | PromiseLike<T>) => void);
	public reject!: (reason?: any) => void;
	
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}
}