type funcProgress<P> = (progress: P) => void;

export default class ProgressPromise<T, P> extends Promise<T> {
	private progressCallbacks: funcProgress<P>[] = [];
	
	constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void, progress: (value: P) => void) => void) {
		super((resolve, reject) => {
			executor(resolve, reject, (progress: P) => {
				for(const callback of this.progressCallbacks) callback(progress);
			});
		});
	}
	
	private updateProgress(progress: P) {
		for(const callback of this.progressCallbacks) callback(progress);
	}
	
	public progress(callback: funcProgress<P>): ProgressPromise<T, P> {
		this.progressCallbacks.push(callback);
		return this;
	}
}