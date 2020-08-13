import {ConnectionErrorCode} from "../data/stateCodes";

export type DataProxyListener = {
	onOpen: () => void,
	onClose: (reason: ConnectionErrorCode) => void,
	onMessage: (data: ArrayBuffer) => void,
};

export default abstract class DataProxy {
	public listener?: DataProxyListener;
	
	/**
	 * Start this proxy's connection to the server
	 */
	abstract start(): void;
	
	/**
	 * Cancel this proxy's connection to the server
	 */
	abstract stop(): void;
	
	/**
	 * Send a packet to the server
	 * @param data The packet to send
	 * @return TRUE if the packet was successfully queued
	 */
	abstract send(data: ArrayBuffer): boolean;
	
	protected notifyOpen() {
		this.listener?.onOpen();
	}
	
	protected notifyClose(reason: ConnectionErrorCode) {
		this.listener?.onClose(reason);
	}

	protected notifyMessage(data: ArrayBuffer) {
		this.listener?.onMessage(data);
	}
}