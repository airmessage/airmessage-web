import AirUnpacker from "./airUnpacker";
import ClientComm5 from "./clientComm5";
import DataProxy from "../dataProxy";
import ConversationTarget from "shared/data/conversationTarget";

export default abstract class ProtocolManager {
  constructor(
    protected communicationsManager: ClientComm5,
    protected dataProxy: DataProxy
  ) {}

  /**
   * Handles incoming data received from the server
   *
   * @param data the data received from the network
   * @param wasEncrypted whether this data was encrypted when it was received
   */
  public abstract processData(data: ArrayBuffer, wasEncrypted: boolean): void;

  /**
   * Sends a ping packet to the server
   *
   * @return whether or not the message was successfully sent
   */
  public abstract sendPing(): boolean;

  /**
   * Sends an authentication request to the server
   *
   * @param unpacker The unpacker of the server's info data, after reading the communications versions
   * @return whether or not the message was successfully sent
   */
  public abstract sendAuthenticationRequest(
    unpacker: AirUnpacker
  ): Promise<boolean>;

  /**
   * Requests a message to be sent to the specified conversation
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
   * Sends a request to retrieve a list of conversations to present to the user
   *
   * @return whether or not the action was successful
   */
  public abstract requestLiteConversation(): boolean;

  /**
   * Requests information regarding a certain list of conversations
   *
   * @param chatGUIDs a list of chat GUIDs to request information of
   * @return whether or not the request was successfully sent
   */
  public abstract requestConversationInfo(chatGUIDs: string[]): boolean;

  /**
   * Sends a request to retrieve messages from a conversation thread
   *
   * @param chatGUID the GUID of the chat to fetch messages from
   * * @param firstMessageID The ID of the first received message
   * @return whether or not the action was successful
   */
  public abstract requestLiteThread(
    chatGUID: string,
    firstMessageID?: number
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
   * Requests a mass message retrieval
   *
   * @param requestID the ID used to validate conflicting requests
   * @param params the mass retrieval parameters to use
   * @return whether or not the request was successfully sent
   */
  //public abstract requestRetrievalAll(requestID: number, params: any): boolean;

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
}
