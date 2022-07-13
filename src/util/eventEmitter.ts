import UnsubscribeCallback from "shared/data/unsubscribeCallback";

/**
 * A listener that receives updates from an EventEmitter
 */
export interface EventEmitterListener<T> {
  (event: T): void;
}

/**
 * A stream of events that can be notified or subscribed to
 */
export default class EventEmitter<T> {
  private readonly listeners: EventEmitterListener<T>[] = [];

  /**
   * Subscribes to updates from this EventEmitter
   * @param listener The listener to subscribe to this emitter
   * @param unsubscribeConsumer An optional callback function that
   * will receive an instance of this subscription's unsubscribe callback
   */
  public subscribe(
    listener: EventEmitterListener<T>,
    unsubscribeConsumer?: (callback: UnsubscribeCallback) => void
  ): UnsubscribeCallback {
    this.listeners.push(listener);

    const unsubscribeCallback = () => this.unsubscribe(listener);
    unsubscribeConsumer?.(unsubscribeCallback);
    return unsubscribeCallback;
  }

  /**
   * Unsubscribes a listener from this event emitter
   */
  public unsubscribe(listener: EventEmitterListener<T>) {
    const index = this.listeners.indexOf(listener, 0);
    if (index !== -1) this.listeners.splice(index, 1);
  }

  /**
   * Notifies all registered listeners of a new event
   */
  public notify(event: T) {
    for (const listener of this.listeners) listener(event);
  }
}

/**
 * An {@link EventEmitter} that automatically emits the last
 * item on subscribe
 */
export class CachedEventEmitter<T> extends EventEmitter<T> {
  private lastEvent: T | null = null;

  constructor(lastEvent: T | null = null) {
    super();
    this.lastEvent = lastEvent;
  }

  public override subscribe(
    listener: EventEmitterListener<T>
  ): UnsubscribeCallback {
    super.subscribe(listener);
    if (this.lastEvent !== null) {
      listener(this.lastEvent);
    }
    return () => this.unsubscribe(listener);
  }

  public override notify(event: T) {
    super.notify(event);
    this.lastEvent = event;
  }
}
