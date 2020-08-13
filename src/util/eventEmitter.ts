export interface Listener<T> {
	(event: T): void;
}

export default class EventEmitter<T> {
	readonly listeners: Listener<T>[] = [];
	
	public registerListener(listener: Listener<T>) {
		this.listeners.push(listener);
	}
	
	public unregisterListener(listener: Listener<T>) {
		const index = this.listeners.indexOf(listener, 0);
		if(index > -1) this.listeners.splice(index, 1);
	}
	
	public notify(event: T) {
		for(const listener of this.listeners) listener(event);
	}
}