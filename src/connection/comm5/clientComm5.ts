import CommunicationsManager from "../communicationsManager";
import ProtocolManager from "./protocolManager";
import AirUnpacker from "./airUnpacker";
import ClientProtocol1 from "./clientProtocol1";
import {ConnectionErrorCode, MessageError, MessageErrorCode} from "../../data/stateCodes";

const targetCommVer = 5;

const handshakeTimeoutTime = 1000 * 10; //10 seconds

//Common NHT
const nhtInformation = 100;

export default class ClientComm5 extends CommunicationsManager {
	//Protocol manager
	private protocolManager: ProtocolManager | null = null;
	private protocolManagerVer: number | undefined;
	
	//State
	private handshakeTimeout : any | undefined;
	
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
		this.handshakeTimeout = setTimeout(this.handleHandshakeTimeout.bind(this), handshakeTimeoutTime);
	}
	
	stopTimeoutTimer() {
		if(this.handshakeTimeout) clearTimeout(this.handshakeTimeout);
	}
	
	protected handleMessage(data: ArrayBuffer): void {
		//Letting the protocol manager handle the data if it is available
		if(this.protocolManager) {
			this.protocolManager.processData(data);
			return;
		}
		
		//Wrapping the data
		const unpacker = new AirUnpacker(data);
		
		//Reading the message type
		const messageType = unpacker.unpackInt();
		
		if(messageType === nhtInformation) {
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
		if(commVer !== targetCommVer) {
			//Terminating the connection
			this.disconnect(commVer < targetCommVer ? ConnectionErrorCode.ServerOutdated : ConnectionErrorCode.ClientOutdated);
			
			return;
		}

		//Finding a matching protocol manager
		const protocolManager = this.findProtocolManager(commSubVer);
		if(!protocolManager) {
			this.disconnect(ConnectionErrorCode.ClientOutdated);
			return;
		}
		
		//Sending the handshake data
		protocolManager.sendAuthenticationRequest(unpacker);
		
		//Setting the protocol manager
		this.protocolManager = protocolManager;
		this.protocolManagerVer = commSubVer;
	}

	findProtocolManager(subVersion: number): ProtocolManager | null {
		switch(subVersion) {
			case 1:
				return new ClientProtocol1(this, this.dataProxy);
			default:
				return null;
		}
	}
	
	requestAttachmentDownload(requestID: number, attachmentGUID: string): boolean {
		return this.protocolManager?.requestAttachmentDownload(requestID, attachmentGUID) ?? false;
	}
	
	requestChatCreation(requestID: number, members: string[], service: string): boolean {
		return this.protocolManager?.requestChatCreation(requestID, members, service) ?? false;
	}
	
	requestRetrievalTime(timeLower: Date, timeUpper: Date): boolean {
		return false;
	}
	
	sendMessage(requestID: number, chatGUID: string, message: string): boolean {
		return this.protocolManager?.sendMessage(requestID, chatGUID, message) ?? false;
	}
	
	sendFile(requestID: number, chatGUID: string, file: File, progressCallback: (bytesUploaded: number) => void): Promise<string> {
		return this.protocolManager?.sendFile(requestID, chatGUID, file, progressCallback) ?? Promise.reject({code: MessageErrorCode.LocalNetwork} as MessageError);
	}
	
	sendPing(): boolean {
		if(!this.protocolManager) return false;
		else return this.protocolManager.sendPing();
	}
	
	requestLiteConversations(): boolean {
		return this.protocolManager?.requestLiteConversation() ?? false;
	}
	
	requestConversationInfo(chatGUIDs: string[]): boolean {
		return this.protocolManager?.requestConversationInfo(chatGUIDs) ?? false;
	}
	
	requestLiteThread(chatGUID: string, firstMessageID?: number): boolean {
		return this.protocolManager?.requestLiteThread(chatGUID, firstMessageID) || false;
	}
	
	private handleHandshakeTimeout(): void {
		//Clearing the timeout reference
		this.handshakeTimeout = undefined;
		
		//Disconnecting
		this.disconnect(ConnectionErrorCode.Internet)
	}
	
	get communicationsVersion(): string | undefined {
		return targetCommVer + "." + (this.protocolManagerVer ?? "X");
	}
}