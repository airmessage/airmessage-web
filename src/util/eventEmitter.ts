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

export class CachedEventEmitter<T> extends EventEmitter<T> {
	private lastEvent: T | null = null;
	
	constructor(lastEvent: T | null = null) {
		super();
		this.lastEvent = lastEvent;
	}
	
	public override registerListener(listener: Listener<T>) {
		super.registerListener(listener);
		if(this.lastEvent !== null) {
			listener(this.lastEvent);
		}
	}
	
	public override notify(event: T) {
		super.notify(event);
		this.lastEvent = event;
	}
}