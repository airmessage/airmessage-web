import CommunicationsManager from "../communicationsManager";
import ProtocolManager from "./protocolManager";
import AirUnpacker from "./airUnpacker";
import {
  ConnectionErrorCode,
  MessageError,
  MessageErrorCode,
} from "../../data/stateCodes";
import ClientProtocol4 from "shared/connection/comm5/clientProtocol4";
import ClientProtocol5 from "shared/connection/comm5/clientProtocol5";
import ConversationTarget from "shared/data/conversationTarget";

const targetCommVer = 5;

const handshakeTimeoutTime = 1000 * 10; //10 seconds

//Common NHT
const nhtInformation = 100;

export default class ClientComm5 extends CommunicationsManager {
  //Protocol manager
  private protocolManager: ProtocolManager | null = null;
  private protocolManagerVer: number | undefined;

  //State
  private handshakeTimeout: ReturnType<typeof setTimeout> | undefined;

  protected handleOpen(): void {
    //Starting the handshake timeout
    this.startTimeoutTimer();
  }

  protected handleClose(reason: ConnectionErrorCode): void {
    //Cancelling the handshake timeout
    this.stopTimeoutTimer();

    //Invalidating the protocol manager
    this.protocolManager = null;
    this.protocolManagerVer = undefined;
  }

  startTimeoutTimer() {
    this.handshakeTimeout = setTimeout(
      this.handleHandshakeTimeout.bind(this),
      handshakeTimeoutTime
    );
  }

  stopTimeoutTimer() {
    if (this.handshakeTimeout) clearTimeout(this.handshakeTimeout);
  }

  protected handleMessage(data: ArrayBuffer, isEncrypted: boolean): void {
    //Letting the protocol manager handle the data if it is available
    if (this.protocolManager) {
      this.protocolManager.processData(data, isEncrypted);
      return;
    }

    //Wrapping the data
    const unpacker = new AirUnpacker(data);

    //Reading the message type
    const messageType = unpacker.unpackInt();

    if (messageType === nhtInformation) {
      this.processServerInformation(unpacker);
    }
  }

  private processServerInformation(unpacker: AirUnpacker) {
    //Restarting the authentication timer
    this.stopTimeoutTimer();
    this.startTimeoutTimer();

    //Reading the communications version information
    const commVer = unpacker.unpackInt();
    const commSubVer = unpacker.unpackInt();

    //Checking if the client can't handle this communications version
    if (commVer !== targetCommVer) {
      //Terminating the connection
      this.disconnect(
        commVer < targetCommVer
          ? ConnectionErrorCode.ServerOutdated
          : ConnectionErrorCode.ClientOutdated
      );

      return;
    }

    //Finding a matching protocol manager
    const protocolManagerOrError = this.findProtocolManager(commSubVer);
    if (typeof protocolManagerOrError === "number") {
      this.disconnect(protocolManagerOrError);
      return;
    }

    //Sending the handshake data
    protocolManagerOrError.sendAuthenticationRequest(unpacker);

    //Setting the protocol manager
    this.protocolManager = protocolManagerOrError;
    this.protocolManagerVer = commSubVer;
  }

  findProtocolManager(
    subVersion: number
  ):
    | ProtocolManager
    | ConnectionErrorCode.ClientOutdated
    | ConnectionErrorCode.ServerOutdated {
    switch (subVersion) {
      case 4:
        return new ClientProtocol4(this, this.dataProxy);
      case 5:
        return new ClientProtocol5(this, this.dataProxy);
      default:
        if (subVersion < 4) return ConnectionErrorCode.ServerOutdated;
        else return ConnectionErrorCode.ClientOutdated;
    }
  }

  requestAttachmentDownload(
    requestID: number,
    attachmentGUID: string
  ): boolean {
    return (
      this.protocolManager?.requestAttachmentDownload(
        requestID,
        attachmentGUID
      ) ?? false
    );
  }

  requestChatCreation(
    requestID: number,
    members: string[],
    service: string
  ): boolean {
    return (
      this.protocolManager?.requestChatCreation(requestID, members, service) ??
      false
    );
  }

  requestRetrievalTime(timeLower: Date, timeUpper: Date): boolean {
    return (
      this.protocolManager?.requestRetrievalTime(timeLower, timeUpper) ?? false
    );
  }

  requestRetrievalID(
    idLower: number,
    timeLower: Date,
    timeUpper: Date
  ): boolean {
    return (
      this.protocolManager?.requestRetrievalID(idLower, timeLower, timeUpper) ??
      false
    );
  }

  sendMessage(
    requestID: number,
    conversation: ConversationTarget,
    message: string
  ): boolean {
    return (
      this.protocolManager?.sendMessage(requestID, conversation, message) ??
      false
    );
  }

  sendFile(
    requestID: number,
    conversation: ConversationTarget,
    file: File,
    progressCallback: (bytesUploaded: number) => void
  ): Promise<string> {
    return (
      this.protocolManager?.sendFile(
        requestID,
        conversation,
        file,
        progressCallback
      ) ??
      Promise.reject({ code: MessageErrorCode.LocalNetwork } as MessageError)
    );
  }

  sendPing(): boolean {
    if (!this.protocolManager) return false;
    else return this.protocolManager.sendPing();
  }

  requestLiteConversations(): boolean {
    return this.protocolManager?.requestLiteConversation() ?? false;
  }

  requestConversationInfo(chatGUIDs: string[]): boolean {
    return this.protocolManager?.requestConversationInfo(chatGUIDs) ?? false;
  }

  requestLiteThread(chatGUID: string, firstMessageID?: number): boolean {
    return (
      this.protocolManager?.requestLiteThread(chatGUID, firstMessageID) || false
    );
  }

  requestInstallRemoteUpdate(updateID: number): boolean {
    return this.protocolManager?.requestInstallRemoteUpdate(updateID) || false;
  }

  requestFaceTimeLink(): boolean {
    return this.protocolManager?.requestFaceTimeLink() || false;
  }

  initiateFaceTimeCall(addresses: string[]): boolean {
    return this.protocolManager?.initiateFaceTimeCall(addresses) || false;
  }

  handleIncomingFaceTimeCall(caller: string, accept: boolean): boolean {
    return (
      this.protocolManager?.handleIncomingFaceTimeCall(caller, accept) || false
    );
  }

  dropFaceTimeCallServer(): boolean {
    return this.protocolManager?.dropFaceTimeCallServer() || false;
  }

  private handleHandshakeTimeout(): void {
    //Clearing the timeout reference
    this.handshakeTimeout = undefined;

    //Disconnecting
    this.disconnect(ConnectionErrorCode.Internet);
  }

  get communicationsVersion(): number[] {
    if (this.protocolManagerVer !== undefined) {
      return [targetCommVer, this.protocolManagerVer];
    } else {
      return [targetCommVer];
    }
  }
}
