import AirUnpacker from "./airUnpacker";
import ClientComm5 from "./clientComm5";
import DataProxy from "../dataProxy";

export default abstract class ProtocolManager {
	constructor(protected communicationsManager: ClientComm5, protected dataProxy: DataProxy) {
	
	}
	
	/**
	 * Handles incoming data received from the server
	 *
	 * @param data the data received from the network
	 */
	public abstract processData(data: ArrayBuffer): void;
	
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
	public abstract sendAuthenticationRequest(unpacker: AirUnpacker): boolean;
	
	/**
	 * Requests a message to be sent to the specified conversation
	 *
	 * @param requestID the ID of the request
	 * @param chatGUID the GUID of the target conversation
	 * @param message the message to send
	 * @return whether or not the request was successfully sent
	 */
	public abstract sendMessage(requestID: number, chatGUID: string, message: string): boolean;
	
	/**
	 * Sends an attachment file to the specified conversation
	 *
	 * @param requestID the ID of the request
	 * @param chatGUID the GUID of the target conversation
	 * @param file the file to send
	 * @param progressCallback a callback called periodically with the number of bytes uploaded
	 * @return a promise that completes with the file hash once the file has been fully uploaded
	 */
	public abstract async sendFile(requestID: number, chatGUID: string, file: File, progressCallback: (bytesUploaded: number) => void): Promise<string>;
	
	/**
	 * Requests the download of a remote attachment
	 *
	 * @param requestID the ID of the request
	 * @param attachmentGUID the GUID of the attachment to fetch
	 * @return whether or not the request was successful
	 */
	public abstract requestAttachmentDownload(requestID: number, attachmentGUID: string): boolean;
	
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
	public abstract requestLiteThread(chatGUID: string, firstMessageID?: number): boolean;
	
	/**
	 * Requests a time range-based message retrieval
	 *
	 * @param timeLower the lower time range limit
	 * @param timeUpper the upper time range limit
	 * @return whether or not the request was successfully sent
	 */
	public abstract requestRetrievalTime(timeLower: Date, timeUpper: Date): boolean;
	
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
	public abstract requestChatCreation(requestID: number, members: string[], service: string): boolean;
}