import DataProxy from "./dataProxy";
import {AttachmentRequestErrorCode, ConnectionErrorCode, CreateChatErrorCode, MessageError} from "../data/stateCodes";
import {Conversation, ConversationItem, MessageModifier} from "../data/blocks";

export interface CommunicationsManagerListener {
	onOpen: (systemVersion: string, softwareVersion: string) => void;
	onClose: (reason: ConnectionErrorCode) => void;
	onPacket: () => void;
	onMessageUpdate: (data: ConversationItem[]) => void;
	onConversationUpdate: (data: [string, Conversation | undefined][]) => void;
	onModifierUpdate: (data: MessageModifier[]) => void;
	onFileRequestStart: (requestID: number, dataLength: number) => void;
	onFileRequestData: (requestID: number, data: ArrayBuffer) => void;
	onFileRequestComplete: (requestID: number) => void;
	onFileRequestFail: (requestID: number, error: AttachmentRequestErrorCode) => void;
	onMessageConversations: (data: Conversation[]) => void;
	onMessageThread: (chatGUID: string, firstMessageID: number | undefined, data: ConversationItem[]) => void;
	onSendMessageResponse: (requestID: number, error: MessageError | undefined) => void;
	onCreateChatResponse: (requestID: number, error: CreateChatErrorCode | undefined, details: string | undefined) => void;
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
			onMessage: (data: ArrayBuffer) => {
				//Handling the event
				this.handleMessage(data);
			}
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
		if(code) this.dataProxy.stopWithReason(code);
		else this.dataProxy.stop();
	}
	
	//Used in implementations
	protected abstract handleOpen(): void;
	protected abstract handleClose(reason: ConnectionErrorCode): void;
	protected abstract handleMessage(data: ArrayBuffer): void;
	
	public onHandshake(installationID: string, deviceName: string, systemVersion: string, softwareVersion: string): void {
		//Forwarding the event to the listener
		this.listener?.onOpen(systemVersion, softwareVersion);
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
	public abstract requestLiteThread(chatGUID: string, firstMessageID?: number): boolean;
	
	/**
	 * Sends a message to the specified conversation
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
	 * Requests a time range-based message retrieval
	 *
	 * @param timeLower the lower time range limit
	 * @param timeUpper the upper time range limit
	 * @return whether or not the request was successfully sent
	 */
	public abstract requestRetrievalTime(timeLower: Date, timeUpper: Date): boolean;
	
	/**
	 * Requests the creation of a new conversation on the server
	 * @param requestID the ID used to validate conflicting requests
	 * @param members the participating members' contact addresses for this conversation
	 * @param service the service that this conversation will use
	 * @return whether or not the request was successfully sent
	 */
	public abstract requestChatCreation(requestID: number, members: string[], service: string): boolean;
	
	/**
	 * Get the current active communications version for this connection
	 */
	public abstract get communicationsVersion(): string | undefined;
}