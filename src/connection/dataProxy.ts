import { ConnectionErrorCode } from "../data/stateCodes";

export type DataProxyListener = {
  onOpen: () => void;
  onClose: (reason: ConnectionErrorCode) => void;
  onMessage: (data: ArrayBuffer, isEncrypted: boolean) => void;
};

export default abstract class DataProxy {
  abstract readonly proxyType: string;
  public listener?: DataProxyListener;
  private pendingErrorCode: ConnectionErrorCode | undefined = undefined;
  public serverRequestsEncryption: boolean = false;

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
   * @param encrypt Whether to encrypt the data before sending
   * @return TRUE if the packet was successfully queued
   */
  abstract send(data: ArrayBuffer, encrypt: boolean): void;

  stopWithReason(reason: ConnectionErrorCode) {
    this.pendingErrorCode = reason;
    this.stop();
  }

  protected notifyOpen() {
    this.listener?.onOpen();
  }

  protected notifyClose(reason: ConnectionErrorCode) {
    //Consuming the pending error code if it is available
    if (this.pendingErrorCode) {
      this.listener?.onClose(this.pendingErrorCode);
      this.pendingErrorCode = undefined;
    } else {
      this.listener?.onClose(reason);
    }
  }

  protected notifyMessage(data: ArrayBuffer, isEncrypted: boolean) {
    this.listener?.onMessage(data, isEncrypted);
  }
}
