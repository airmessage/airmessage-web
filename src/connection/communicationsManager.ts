import DataProxy from "./dataProxy";
import {
  AttachmentRequestErrorCode,
  ConnectionErrorCode,
  CreateChatErrorCode,
  FaceTimeInitiateCode,
  MessageError,
  RemoteUpdateErrorCode,
} from "../data/stateCodes";
import {
  Conversation,
  ConversationItem,
  LinkedConversation,
  MessageModifier,
} from "../data/blocks";
import { TransferAccumulator } from "./transferAccumulator";
import ServerUpdateData from "shared/data/serverUpdateData";
import ConversationTarget from "shared/data/conversationTarget";

export interface CommunicationsManagerListener {
  onOpen(
    computerName: string,
    systemVersion: string,
    softwareVersion: string,
    supportsFaceTime: boolean
  ): void;
  onClose(reason: ConnectionErrorCode): void;
  onPacket(): void;

  onMessageUpdate(data: ConversationItem[]): void;
  onConversationUpdate(data: [string, Conversation | undefined][]): void;
  onModifierUpdate(data: MessageModifier[]): void;

  onFileRequestStart(
    requestID: number,
    downloadFileName: string | undefined,
    downloadFileType: string | undefined,
    dataLength: number,
    accumulator: TransferAccumulator
  ): void;
  onFileRequestData(requestID: number, data: ArrayBuffer): void;
  onFileRequestComplete(requestID: number): void;
  onFileRequestFail(requestID: number, error: AttachmentRequestErrorCode): void;

  onIDUpdate(messageID: number): void;

  onMessageConversations(data: LinkedConversation[]): void;
  onMessageThread(
    chatGUID: string,
    firstMessageID: number | undefined,
    data: ConversationItem[]
  ): void;

  onSendMessageResponse(
    requestID: number,
    error: MessageError | undefined
  ): void;
  onCreateChatResponse(
    requestID: number,
    error: CreateChatErrorCode | undefined,
    details: string | undefined
  ): void;

  onSoftwareUpdateListing(updateData: ServerUpdateData | undefined): void;
  onSoftwareUpdateInstall(installing: boolean): void;
  onSoftwareUpdateError(
    error: RemoteUpdateErrorCode,
    details: string | undefined
  ): void;

  onFaceTimeNewLink(faceTimeLink: string | undefined): void;
  onFaceTimeOutgoingCallInitiated(
    resultCode: FaceTimeInitiateCode,
    errorDetails: string | undefined
  ): void;
  onFaceTimeOutgoingCallAccepted(faceTimeLink: string): void;
  onFaceTimeOutgoingCallRejected(): void;
  onFaceTimeOutgoingCallError(errorDetails: string | undefined): void;
  onFaceTimeIncomingCall(caller: string | undefined): void;
  onFaceTimeIncomingCallHandled(faceTimeLink: string): void;
  onFaceTimeIncomingCallError(errorDetails: string | undefined): void;
}

export default abstract class CommunicationsManager {
  public listener?: CommunicationsManagerListener;

  constructor(protected dataProxy: DataProxy) {
    //Setting the data proxy listener
    dataProxy.listener = {
      onOpen: () => {
        //Handling the event
        this.handleOpen();
      },
      onClose: (reason: ConnectionErrorCode) => {
        //Forwarding the event to the listener
        this.listener?.onClose(reason);

        //Handling the event
        this.handleClose(reason);
      },
      onMessage: (data: ArrayBuffer, isEncrypted: boolean) => {
        //Handling the event
        this.handleMessage(data, isEncrypted);
      },
    };
  }

  /**
   * Connects to the server
   */
  public connect() {
    //Connecting the proxy
    this.dataProxy.start();
  }

  /**
   * Disconnects the connection manager from the server
   */
  public disconnect(code?: ConnectionErrorCode) {
    //Disconnecting the proxy
    if (code) this.dataProxy.stopWithReason(code);
    else this.dataProxy.stop();
  }

  //Used in implementations
  protected abstract handleOpen(): void;
  protected abstract handleClose(reason: ConnectionErrorCode): void;
  protected abstract handleMessage(
    data: ArrayBuffer,
    isEncrypted: boolean
  ): void;

  public onHandshake(
    installationID: string,
    deviceName: string,
    systemVersion: string,
    softwareVersion: string,
    supportsFaceTime: boolean = false
  ): void {
    //Forwarding the event to the listener
    this.listener?.onOpen(
      deviceName,
      systemVersion,
      softwareVersion,
      supportsFaceTime
    );
  }

  /**
   * Sends a ping packet to the server
   *
   * @return whether or not the message was successfully sent
   */
  public abstract sendPing(): boolean;

  /**
   * Requests a list of conversation information from the server
   *
   * @return whether or not the request was successfully sent
   */
  public abstract requestLiteConversations(): boolean;

  /**
   * Requests information regarding a certain list of conversations
   *
   * @param chatGUIDs a list of chat GUIDs to request information of
   * @return whether or not the request was successfully sent
   */
  public abstract requestConversationInfo(chatGUIDs: string[]): boolean;

  /**
   * Requests a list of messages from a conversation thread from the server
   *
   * @param chatGUID the GUID of the target conversation
   * @param firstMessageID The ID of the first received message
   * @return whether or not the request was successfully sent
   */
  public abstract requestLiteThread(
    chatGUID: string,
    firstMessageID?: number
  ): boolean;

  /**
   * Sends a message to the specified conversation
   *
   * @param requestID the ID of the request
   * @param conversation the target conversation
   * @param message the message to send
   * @return whether or not the request was successfully sent
   */
  public abstract sendMessage(
    requestID: number,
    conversation: ConversationTarget,
    message: string
  ): boolean;

  /**
   * Sends an attachment file to the specified conversation
   *
   * @param requestID the ID of the request
   * @param conversation the target conversation
   * @param file the file to send
   * @param progressCallback a callback called periodically with the number of bytes uploaded
   * @return a promise that completes with the file hash once the file has been fully uploaded
   */
  public abstract sendFile(
    requestID: number,
    conversation: ConversationTarget,
    file: File,
    progressCallback: (bytesUploaded: number) => void
  ): Promise<string>;

  /**
   * Requests the download of a remote attachment
   *
   * @param requestID the ID of the request
   * @param attachmentGUID the GUID of the attachment to fetch
   * @return whether or not the request was successful
   */
  public abstract requestAttachmentDownload(
    requestID: number,
    attachmentGUID: string
  ): boolean;

  /**
   * Requests a time range-based message retrieval
   *
   * @param timeLower the lower time range limit
   * @param timeUpper the upper time range limit
   * @return whether or not the request was successfully sent
   */
  public abstract requestRetrievalTime(
    timeLower: Date,
    timeUpper: Date
  ): boolean;

  /**
   * Requests an ID range-based message retrieval
   * @param idLower The ID to retrieve messages beyond (exclusive)
   * @param timeLower The lower time range limit
   * @param timeUpper The upper time range limit
   * @return Whether the request was successfully sent
   */
  public abstract requestRetrievalID(
    idLower: number,
    timeLower: Date,
    timeUpper: Date
  ): boolean;

  /**
   * Requests the creation of a new conversation on the server
   * @param requestID the ID used to validate conflicting requests
   * @param members the participating members' contact addresses for this conversation
   * @param service the service that this conversation will use
   * @return whether or not the request was successfully sent
   */
  public abstract requestChatCreation(
    requestID: number,
    members: string[],
    service: string
  ): boolean;

  /**
   * Requests the installation of a remote update
   * @param updateID The ID of the update to install
   * @return Whether the request was successfully sent
   */
  public abstract requestInstallRemoteUpdate(updateID: number): boolean;

  /**
   * Requests a new FaceTime link
   * @return Whether the request was successfully sent
   */
  public abstract requestFaceTimeLink(): boolean;

  /**
   * Initiates a new outgoing FaceTime call with the specified addresses
   * @param addresses The list of addresses to initiate the call with
   * @return Whether the request was successfully sent
   */
  public abstract initiateFaceTimeCall(addresses: string[]): boolean;

  /**
   * Accepts or rejects a pending incoming FaceTime call
   * @param caller The name of the caller to accept or reject the call of
   * @param accept True to accept the call, or false to reject
   * @return Whether the request was successfully sent
   */
  public abstract handleIncomingFaceTimeCall(
    caller: string,
    accept: boolean
  ): boolean;

  /**
   * Tells the server to leave the FaceTime call.
   * This should be called after the client has connected to the call with the
   * FaceTime link to avoid two of the same user connected.
   * @return Whether the request was successfully sent
   */
  public abstract dropFaceTimeCallServer(): boolean;

  /**
   * Get the current active communications version for this connection
   */
  public abstract get communicationsVersion(): number[];
}
