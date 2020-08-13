type funcResult<R> = (result: R) => void;
type funcFail<E> = (error: E) => void;
type funcProgress<P> = (progress: P) => void;

export default class ProgressCallback<R, E, P> {
	private readonly listenersResult: funcResult<R>[] = [];
	private readonly listenersFail: funcFail<E>[] = [];
	private readonly listenersProgress: funcProgress<P>[] = [];
	
	public then(callback: funcResult<R>) {
		this.listenersResult.push(callback);
	}
	
	public catch(callback: funcFail<E>) {
		this.listenersFail.push(callback);
	}
	
	public progress(callback: funcProgress<P>) {
		this.listenersProgress.push(callback);
	}
	
	public notifyResult(result: R) {
		for(const listener of this.listenersResult) listener(result);
	}
	
	public notifyFail(result: E) {
		for(const listener of this.listenersFail) listener(result);
	}
	
	public notifyProgress(progress: P) {
		for(const listener of this.listenersProgress) listener(progress);
	}
}