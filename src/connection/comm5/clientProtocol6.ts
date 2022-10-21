import ProtocolManager from "./protocolManager";
import AirUnpacker from "./airUnpacker";
import {UAParser} from "ua-parser-js";
import pako from "pako";
import {getInstallationID} from "../../util/installationUtils";
import AirPacker from "./airPacker";
import {
	AttachmentItem,
	Conversation,
	ConversationItem,
	LinkedConversation,
	MessageModifier,
	StickerItem,
	TapbackItem
} from "../../data/blocks";
import {
	AttachmentRequestErrorCode,
	ConnectionErrorCode,
	ConversationItemType,
	ConversationPreviewType,
	CreateChatErrorCode,
	FaceTimeInitiateCode,
	MessageError,
	MessageErrorCode,
	MessageModifierType,
	MessageStatusCode,
	ParticipantActionType,
	RemoteUpdateErrorCode,
	TapbackType
} from "../../data/stateCodes";
import SparkMD5 from "spark-md5";
import {InflatorAccumulator} from "../transferAccumulator";
import {encryptData, isCryptoPasswordAvailable} from "shared/util/encryptionUtils";
import ServerUpdateData from "shared/data/serverUpdateData";
import {generateConversationLocalID} from "shared/util/conversationUtils";
import ConversationTarget from "shared/data/conversationTarget";
import {arrayBufferToHex} from "shared/util/encodingUtils";

const attachmentChunkSize = 2 * 1024 * 1024; //2 MiB

//Top-level net header type values
const nhtClose = 0;
const nhtPing = 1;
const nhtPong = 2;

const nhtAuthentication = 101;

const nhtMessageUpdate = 200;
const nhtTimeRetrieval = 201;
const nhtIDRetrieval = 202;
const nhtMassRetrieval = 203;
const nhtMassRetrievalFile = 204;
const nhtMassRetrievalFinish = 205;
const nhtConversationUpdate = 206;
const nhtModifierUpdate = 207;
const nhtAttachmentReq = 208;
const nhtAttachmentReqConfirm = 209;
const nhtAttachmentReqFail = 210;
const nhtIDUpdate = 211;

const nhtLiteConversationRetrieval = 300;
const nhtLiteThreadRetrieval = 301;

const nhtSendResult = 400;
const nhtSendTextExisting = 401;
const nhtSendTextNew = 402;
const nhtSendFileExisting = 403;
const nhtSendFileNew = 404;
const nhtCreateChat = 405;

const nhtSoftwareUpdateListing = 500;
const nhtSoftwareUpdateInstall = 501;
const nhtSoftwareUpdateError = 502;

const nhtFaceTimeCreateLink = 600; //Create a new FaceTime link
const nhtFaceTimeOutgoingInitiate = 601; //Initiate a new FaceTime call
const nhtFaceTimeOutgoingHandled = 602; //Notify a client that an outgoing call has been accepted or rejected
const nhtFaceTimeIncomingCallerUpdate = 603; //Notify clients that there is a new incoming call
const nhtFaceTimeIncomingHandle = 604; //Client -> Server: accept or reject the incoming call and return its link
const nhtFaceTimeDisconnect = 605; //Client -> Server: Drop the current call

//State codes
enum NRCMessageReceiptState {
	Idle = 0,
	Sent = 1,
	Delivered = 2,
	Read = 3
}

enum NRCMessageDBState {
	OK,
	Unknown, //Unknown error code
	Network, //Network error
	Unregistered //Not registered with iMessage
}

//Result codes
enum NRCAuthenticationResult {
	OK = 0,
	Unauthorized = 1,
	BadRequest = 2
}

enum NRCAttachmentError {
	NotFound = 1, //File GUID not found
	NotSaved = 2, //File (on disk) not found
	Unreadable = 3, //No access to file
	IOError = 4 //I/O error
}

enum NRCSendResult {
	OK = 0, //Message sent successfully
	ScriptError = 1, //Some unknown AppleScript error
	BadRequest = 2, //Invalid data received
	Unauthorized = 3, //System rejected request to send message
	NoConversation = 4, //A valid conversation wasn't found
	RequestTimeout = 5, //File data blocks stopped being received
	InternalError = 6 //Internal server error
}

enum NRCCreateChatResult {
	OK = 0,
	ScriptError = 1, //Some unknown AppleScript error
	BadRequest = 2, //Invalid data received
	Unauthorized = 3, //System rejected request to send message
	NotSupported = 4 //Operation not supported by the server
}

enum NRCUpdateError {
	Download = 0, //Failed to download update
	BadPackage = 1, //Failed to validate update package
	Internal = 2, //Internal update error
	ReadOnlyVolume = 3 //App bundle is not writable
}

enum NRCFaceTimeCallInitiate {
	OK = 0, //Call initiated
	BadMembers = 1, //Members are not available on FaceTime
	AppleScriptError = 2 //AppleScript error
}

enum NRCFaceTimeCallHandled {
	Accepted = 0, //Call accepted
	Rejected = 1, //Call rejected
	Error = 2 //An error occurred
}

//Item types
enum NSTConversationItemType {
	Message = 0,
	ParticipantAction = 1,
	ChatRename = 2
}

enum NSTModifierType {
	Activity,
	Sticker,
	Tapback,
	Edit
}

enum NSTGroupActionType {
	Unknown = 0,
	Join = 1,
	Leave = 2
}

type AMBrowser = "chrome" | "safari" | "firefox" | "edge" | "browser";

export default class ClientProtocol6 extends ProtocolManager {
	processData(data: ArrayBuffer, wasEncrypted: boolean): void {
		//Notifying the communications manager of a new incoming message
		this.communicationsManager.listener?.onPacket();

		try {
			//Unpacking the message
			const unpacker = new AirUnpacker(data);
			const messageType = unpacker.unpackInt();

			//Processing the message data
			if(wasEncrypted) {
				this.processDataSecure(messageType, unpacker);
			} else {
				this.processDataInsecure(messageType, unpacker);
			}
		} catch(error) {
			console.warn(error);
		}
	}

	private processDataInsecure(messageType: number, unpacker: AirUnpacker) {
		switch(messageType) {
			case nhtClose:
				this.communicationsManager.disconnect(ConnectionErrorCode.Connection);
				break;
			case nhtPing: {
				//Replying with a pong
				const packer = AirPacker.get();
				try {
					packer.packInt(nhtPong);
					this.dataProxy.send(packer.toArrayBuffer(), false);
				} finally {
					packer.reset();
				}

				break;
			}
			case nhtAuthentication:
				this.handleMessageAuthentication(unpacker);
				break;
		}
	}

	private processDataSecure(messageType: number, unpacker: AirUnpacker) {
		switch(messageType) {
			case nhtMessageUpdate:
			case nhtTimeRetrieval:
				this.handleMessageUpdate(unpacker);
				break;
			case nhtConversationUpdate:
				this.handleConversationUpdate(unpacker);
				break;
			case nhtModifierUpdate:
				this.handleModifierUpdate(unpacker);
				break;
			case nhtAttachmentReq:
				this.handleMessageAttachmentRequest(unpacker);
				break;
			case nhtAttachmentReqConfirm:
				this.handleMessageAttachmentRequestConfirm(unpacker);
				break;
			case nhtAttachmentReqFail:
				this.handleMessageAttachmentRequestFail(unpacker);
				break;
			case nhtIDUpdate:
				this.handleMessageIDUpdate(unpacker);
				break;
			case nhtLiteConversationRetrieval:
				this.handleMessageLiteConversationRetrieval(unpacker);
				break;
			case nhtLiteThreadRetrieval:
				this.handleMessageLiteThreadRetrieval(unpacker);
				break;
			case nhtSendResult:
				this.handleMessageSendResult(unpacker);
				break;
			case nhtCreateChat:
				this.handleMessageCreateChat(unpacker);
				break;
			case nhtSoftwareUpdateListing:
				this.handleMessageSoftwareUpdateListing(unpacker);
				break;
			case nhtSoftwareUpdateInstall:
				this.handleMessageSoftwareUpdateInstall(unpacker);
				break;
			case nhtSoftwareUpdateError:
				this.handleMessageSoftwareUpdateError(unpacker);
				break;
			case nhtFaceTimeCreateLink:
				this.handleMessageFaceTimeCreateLink(unpacker);
				break;
			case nhtFaceTimeOutgoingInitiate:
				this.handleMessageFaceTimeOutgoingInitiate(unpacker);
				break;
			case nhtFaceTimeOutgoingHandled:
				this.handleMessageFaceTimeOutgoingHandled(unpacker);
				break;
			case nhtFaceTimeIncomingCallerUpdate:
				this.handleMessageFaceTimeIncomingCallerUpdate(unpacker);
				break;
			case nhtFaceTimeIncomingHandle:
				this.handleMessageFaceTimeIncomingHandle(unpacker);
				break;
			default:
				this.processDataInsecure(messageType, unpacker);
				break;
		}
	}

	private handleMessageAuthentication(unpacker: AirUnpacker) {
		//Stopping the timeout timer
		this.communicationsManager.stopTimeoutTimer();

		//Reading the result code
		const resultCode = unpacker.unpackInt();

		//Disconnecting if the authentication didn't go through
		if(resultCode !== NRCAuthenticationResult.OK) {
			switch(resultCode) {
				case NRCAuthenticationResult.BadRequest:
					this.communicationsManager.disconnect(ConnectionErrorCode.BadRequest);
					break;
				case NRCAuthenticationResult.Unauthorized:
					this.communicationsManager.disconnect(ConnectionErrorCode.Unauthorized);
					break;
				default:
					this.communicationsManager.disconnect(ConnectionErrorCode.Connection);
					break;
			}

			return;
		}

		//Reading the server's information
		const installationID = unpacker.unpackString();
		const deviceName = unpacker.unpackString();
		const systemVersion = unpacker.unpackString();
		const softwareVersion = unpacker.unpackString();
		/*const userName = */unpacker.unpackString(); //Can't use, discard
		const supportsFaceTime = unpacker.unpackBoolean();

		//Notifying the communications manager
		this.communicationsManager.onHandshake(installationID, deviceName, systemVersion, softwareVersion, supportsFaceTime);
	}

	private handleMessageUpdate(unpacker: AirUnpacker) {
		const messages = unpackArray(unpacker, unpackConversationItem).reverse();
		this.communicationsManager.listener?.onMessageUpdate(messages);
	}

	private handleConversationUpdate(unpacker: AirUnpacker) {
		const conversations = unpackArray(unpacker, unpackRequestedConversation);
		this.communicationsManager.listener?.onConversationUpdate(conversations);
	}

	private handleModifierUpdate(unpacker: AirUnpacker) {
		const modifiers = unpackArray(unpacker, unpackModifier);
		this.communicationsManager.listener?.onModifierUpdate(modifiers);
	}

	private handleMessageAttachmentRequest(unpacker: AirUnpacker) {
		//Reading the response data
		const requestID = unpacker.unpackShort();
		const requestIndex = unpacker.unpackInt();
		let downloadFileName: string | undefined = undefined;
		let downloadFileType: string | undefined = undefined;
		let fileLength: number | undefined = undefined;
		if(requestIndex === 0) {
			downloadFileName = unpacker.unpackNullableString();
			downloadFileType = unpacker.unpackNullableString();
			fileLength = unpacker.unpackLong();
		}
		const isLast = unpacker.unpackBoolean();

		const fileData = unpacker.unpackPayload();

		if(requestIndex === 0) this.communicationsManager.listener?.onFileRequestStart(requestID, downloadFileName, downloadFileType, fileLength!, new InflatorAccumulator());
		this.communicationsManager.listener?.onFileRequestData(requestID, fileData);
		if(isLast) this.communicationsManager.listener?.onFileRequestComplete(requestID);
	}

	private handleMessageAttachmentRequestConfirm(unpacker: AirUnpacker) {
		//Reading the response data
		//const requestID = unpacker.unpackShort();
	}

	private handleMessageAttachmentRequestFail(unpacker: AirUnpacker) {
		//Reading the response data
		const requestID = unpacker.unpackShort();
		const errorCode = mapAttachmentErrorCode(unpacker.unpackInt());

		//Notifying the communications manager
		this.communicationsManager.listener?.onFileRequestFail(requestID, errorCode);
	}

	private handleMessageIDUpdate(unpacker: AirUnpacker) {
		const messageID = unpacker.unpackLong();

		//Notifying the communications manager
		this.communicationsManager.listener?.onIDUpdate(messageID);
	}

	private handleMessageLiteConversationRetrieval(unpacker: AirUnpacker) {
		const conversations = unpackArray(unpacker, unpackPreviewConversation);

		this.communicationsManager.listener?.onMessageConversations(conversations);
	}

	private handleMessageLiteThreadRetrieval(unpacker: AirUnpacker) {
		const chatGUID = unpacker.unpackString();
		const firstMessageID: number | undefined = unpacker.unpackBoolean() ? unpacker.unpackLong() : undefined;
		//Unlike Android, the bottom of the chat is index 0
		const conversationItems = unpackArray(unpacker, unpackConversationItem).reverse();

		this.communicationsManager.listener?.onMessageThread(chatGUID, firstMessageID, conversationItems);
	}

	private handleMessageSendResult(unpacker: AirUnpacker) {
		const requestID = unpacker.unpackShort();
		const errorCode = mapMessageErrorCode(unpacker.unpackInt());
		const details = unpacker.unpackNullableString();

		const messageError: MessageError | undefined = errorCode === undefined ? undefined : {code: errorCode, detail: details};

		this.communicationsManager.listener?.onSendMessageResponse(requestID, messageError);
	}

	private handleMessageCreateChat(unpacker: AirUnpacker) {
		const requestID = unpacker.unpackShort();
		const errorCode = mapCreateChatCode(unpacker.unpackInt());
		const details = unpacker.unpackNullableString();

		this.communicationsManager.listener?.onCreateChatResponse(requestID, errorCode, details);
	}

	private handleMessageSoftwareUpdateListing(unpacker: AirUnpacker) {
		let updateData: ServerUpdateData | undefined = undefined;

		//Read the update data
		const updateExists = unpacker.unpackBoolean();
		if(updateExists) {
			const updateID = unpacker.unpackInt();
			const protocolRequirementCount = unpacker.unpackInt();
			const protocolRequirement: number[] = [];
			for(let i = 0; i < protocolRequirementCount; i++) protocolRequirement.push(unpacker.unpackInt());

			const versionName = unpacker.unpackString();
			const versionNotes = unpacker.unpackString();
			const remoteInstallable = unpacker.unpackBoolean();

			updateData = {
				id: updateID,
				protocolRequirement: protocolRequirement,
				version: versionName,
				notes: versionNotes,
				remoteInstallable: remoteInstallable
			};
		}

		this.communicationsManager.listener?.onSoftwareUpdateListing(updateData);
	}

	private handleMessageSoftwareUpdateInstall(unpacker: AirUnpacker) {
		const updateInstalling = unpacker.unpackBoolean();

		this.communicationsManager.listener?.onSoftwareUpdateInstall(updateInstalling);
	}

	private handleMessageSoftwareUpdateError(unpacker: AirUnpacker) {
		//Reading the message
		const errorCode = mapUpdateErrorCode(unpacker.unpackInt());
		const errorDetails = unpacker.unpackString();

		this.communicationsManager.listener?.onSoftwareUpdateError(errorCode, errorDetails);
	}
	private handleMessageFaceTimeCreateLink(unpacker: AirUnpacker) {
		//Reading the message
		let link: string | undefined = undefined;
		const linkOK = unpacker.unpackBoolean();
		if(linkOK) link = unpacker.unpackString();

		this.communicationsManager.listener?.onFaceTimeNewLink(link);
	}

	private handleMessageFaceTimeOutgoingInitiate(unpacker: AirUnpacker) {
		//Reading the message
		const resultCode = mapFaceTimeInitiateCode(unpacker.unpackInt());
		const errorDetails = unpacker.unpackNullableString();

		//Mapping the result code to a local error code
		this.communicationsManager.listener?.onFaceTimeOutgoingCallInitiated(resultCode, errorDetails);
	}

	private handleMessageFaceTimeOutgoingHandled(unpacker: AirUnpacker) {
		//Reading the message
		const resultCode = unpacker.unpackInt();

		if(resultCode === NRCFaceTimeCallHandled.Accepted) {
			//Our call was accepted :)
			const faceTimeLink = unpacker.unpackString();
			this.communicationsManager.listener?.onFaceTimeOutgoingCallAccepted(faceTimeLink);
		} else if(resultCode === NRCFaceTimeCallHandled.Rejected) {
			//Our call was rejected
			this.communicationsManager.listener?.onFaceTimeOutgoingCallRejected();
		} else if(resultCode === NRCFaceTimeCallHandled.Error) {
			//Something went wrong
			const errorDetails = unpacker.unpackNullableString();
			this.communicationsManager.listener?.onFaceTimeOutgoingCallError(errorDetails);
		}
	}

	private handleMessageFaceTimeIncomingCallerUpdate(unpacker: AirUnpacker) {
		const caller = unpacker.unpackNullableString();
		this.communicationsManager.listener?.onFaceTimeIncomingCall(caller);
	}

	private handleMessageFaceTimeIncomingHandle(unpacker: AirUnpacker) {
		const ok = unpacker.unpackBoolean();
		if(ok) {
			const faceTimeLink = unpacker.unpackString();
			this.communicationsManager.listener?.onFaceTimeIncomingCallHandled(faceTimeLink);
		} else {
			const errorDetails = unpacker.unpackNullableString();
			this.communicationsManager.listener?.onFaceTimeIncomingCallError(errorDetails);
		}
	}

	sendPing(): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtPing);
			this.dataProxy.send(packer.toArrayBuffer(), false);
		} finally {
			packer.reset();
		}

		return true;
	}

	async sendAuthenticationRequest(unpacker: AirUnpacker): Promise<boolean> {
		//Assembling the device information
		const uaParser = new UAParser();
		const browser = uaParser.getBrowser();
		const os = uaParser.getOS();

		const browserName = (browser.name && browser.version) ? `${browser.name} ${browser.version}` : null;
		const platformName = (os.name && os.version) ? `${os.name} ${os.version}` : null;

		const installationID = getInstallationID();
		let clientName: string;
		if(browserName && platformName) clientName = browserName + " — " + platformName;
		else if(browserName) clientName = browserName;
		else if(platformName) clientName = platformName;
		else clientName = "Unknown browser";
		const platformID = mapBrowserAM(browser.name ?? "browser");

		//Checking if the current protocol requires authentication
		if(unpacker.unpackBoolean()) {
			//Checking if we don't have a password to use
			if(!isCryptoPasswordAvailable()) {
				//Failing the connection
				this.communicationsManager.disconnect(ConnectionErrorCode.Unauthorized);
				return false;
			}

			//Telling the data proxy that encrypted messages should be used
			this.dataProxy.serverRequestsEncryption = true;

			//Reading the transmission check
			const transmissionCheck = unpacker.unpackPayload();

			const packer = AirPacker.get();
			try {
				packer.packInt(nhtAuthentication);

				//Building the secure data
				let secureData: ArrayBuffer;
				{
					const securePacker = AirPacker.initialize(1024);
					securePacker.packPayload(transmissionCheck);
					securePacker.packString(installationID);
					securePacker.packString(clientName);
					securePacker.packString(platformID);
					secureData = securePacker.toArrayBuffer();
				}

				//Encrypting the secure data and adding it to the original message
				packer.packPayload(await encryptData(secureData));

				this.dataProxy.send(packer.toArrayBuffer(), false);
			} finally {
				packer.reset();
			}
		} else {
			//Telling the data proxy that encrypted messages should not be used
			this.dataProxy.serverRequestsEncryption = false;

			//Sending a response
			const packer = AirPacker.get();
			try {
				packer.packInt(nhtAuthentication);
				packer.packString(installationID);
				packer.packString(clientName);
				packer.packString(platformID);

				this.dataProxy.send(packer.toArrayBuffer(), true);
			} finally {
				packer.reset();
			}
		}

		return true;
	}

	sendMessage(requestID: number, conversation: ConversationTarget, message: string): boolean {
		const packer = AirPacker.get();
		try {
			if(conversation.type === "linked") packer.packInt(nhtSendTextExisting);
			else packer.packInt(nhtSendTextNew);
			packer.packShort(requestID);
			if(conversation.type === "linked") packer.packString(conversation.guid);
			else {
				packer.packStringArray(conversation.members);
				packer.packString(conversation.service);
			}
			packer.packString(message);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	async sendFile(requestID: number, conversation: ConversationTarget, file: File, progressCallback: (bytesUploaded: number) => void): Promise<string> {
		//TODO find some way to stream deflate
		const fileData = await file.arrayBuffer();
		const hash = SparkMD5.ArrayBuffer.hash(fileData);
		const compressedData = pako.deflate(new Uint8Array(fileData));

		try {
			//Reading the file
			let chunkIndex = 0;
			let readOffset = 0;
			while(readOffset < compressedData.length) {
				const newOffset = readOffset + attachmentChunkSize;
				const chunkData = compressedData.slice(readOffset, newOffset);

				//Uploading the data
				const packer = AirPacker.get();
				try {
					if(conversation.type === "linked") packer.packInt(nhtSendFileExisting);
					else packer.packInt(nhtSendFileNew);

					packer.packShort(requestID);
					packer.packInt(chunkIndex);
					packer.packBoolean(newOffset >= file.size); //Is this the last part?

					packer.packPayload(chunkData);
					if(chunkIndex === 0) {
						packer.packString(file.name);
						if(conversation.type === "linked") packer.packString(conversation.guid);
						else {
							packer.packStringArray(conversation.members);
							packer.packString(conversation.service);
						}
					}

					this.dataProxy.send(packer.toArrayBuffer(), true);
				} finally {
					packer.reset();
				}

				//Updating the index and read offset
				chunkIndex++;
				readOffset = newOffset;

				//Updating the progress
				progressCallback(Math.min(readOffset, file.size));
			}
		} catch(error) {
			const messageError: MessageError = {code: MessageErrorCode.LocalIO};
			return Promise.reject(messageError);
		}

		//Returning with the file's MD5 hash
		return hash;
	}

	requestAttachmentDownload(requestID: number, attachmentGUID: string): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtAttachmentReq);

			packer.packShort(requestID);
			packer.packInt(attachmentChunkSize);
			packer.packString(attachmentGUID);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestLiteConversation(): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtLiteConversationRetrieval);
			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestConversationInfo(chatGUIDs: string[]): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtConversationUpdate);

			packer.packArrayHeader(chatGUIDs.length);
			for(const chatGUID of chatGUIDs) packer.packString(chatGUID);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestLiteThread(chatGUID: string, firstMessageID?: number): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtLiteThreadRetrieval);
			packer.packString(chatGUID);
			if(firstMessageID) {
				packer.packBoolean(true);
				packer.packLong(firstMessageID);
			} else {
				packer.packBoolean(false);
			}
			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestChatCreation(requestID: number, members: string[], service: string): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtCreateChat);

			packer.packShort(requestID);
			packer.packArrayHeader(members.length);
			for(const member of members) packer.packString(member);
			packer.packString(service);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestRetrievalTime(timeLower: Date, timeUpper: Date): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtTimeRetrieval);

			packer.packLong(timeLower.getTime());
			packer.packLong(timeUpper.getTime());

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestRetrievalID(idLower: number, timeLower: Date, timeUpper: Date): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtIDRetrieval);

			packer.packLong(idLower);
			packer.packLong(timeLower.getTime());
			packer.packLong(timeUpper.getTime());

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestInstallRemoteUpdate(updateID: number): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtSoftwareUpdateInstall);
			packer.packInt(updateID);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	requestFaceTimeLink(): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtFaceTimeCreateLink);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	initiateFaceTimeCall(addresses: string[]): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtFaceTimeOutgoingInitiate);
			packer.packArrayHeader(addresses.length);
			for(const address of addresses) {
				packer.packString(address);
			}

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	handleIncomingFaceTimeCall(caller: string, accept: boolean): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtFaceTimeIncomingHandle);
			packer.packString(caller);
			packer.packBoolean(accept);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}

	dropFaceTimeCallServer(): boolean {
		const packer = AirPacker.get();
		try {
			packer.packInt(nhtFaceTimeDisconnect);

			this.dataProxy.send(packer.toArrayBuffer(), true);
		} finally {
			packer.reset();
		}

		return true;
	}
}

function mapBrowserAM(browser: string): AMBrowser {
	switch(browser) {
		case "Chrome":
		case "Chromium":
			return "chrome";
		case "Safari":
		case "Mobile Safari":
			return "safari";
		case "Firefox":
			return "firefox";
		case "Edge":
			return "edge";
		default:
			return "browser";
	}
}

function unpackPreviewConversation(unpacker: AirUnpacker): LinkedConversation {
	const guid = unpacker.unpackString();
	const service = unpacker.unpackString();
	const name = unpacker.unpackNullableString();

	const membersLength = unpacker.unpackArrayHeader();
	const members: string[] = [];
	for(let i = 0; i < membersLength; i++) members[i] = unpacker.unpackString();

	const previewDate = new Date(unpacker.unpackLong());
	/*const previewSender = */unpacker.unpackNullableString();
	const previewText = unpacker.unpackNullableString();
	const previewSendStyle = unpacker.unpackNullableString();
	const previewAttachmentsLength = unpacker.unpackArrayHeader();
	const previewAttachments: string[] = [];
	for(let i = 0; i < previewAttachmentsLength; i++) previewAttachments[i] = unpacker.unpackString();

	return {
		localID: generateConversationLocalID(),
		guid: guid,
		service: service,
		name: name,
		members: members,
		preview: {
			type: ConversationPreviewType.Message,
			date: previewDate,
			text: previewText,
			sendStyle: previewSendStyle,
			attachments: previewAttachments
		},
		unreadMessages: false,
		localOnly: false
	};
}

function unpackRequestedConversation(unpacker: AirUnpacker): [string, Conversation | undefined] {
	const guid = unpacker.unpackString();
	const available = unpacker.unpackBoolean();

	if(available) {
		//Unpack the rest of the conversation data and return it
		const service = unpacker.unpackString();
		const name = unpacker.unpackNullableString();

		const membersLength = unpacker.unpackArrayHeader();
		const members: string[] = [];
		for(let i = 0; i < membersLength; i++) members[i] = unpacker.unpackString();

		return [guid, {
			localID: generateConversationLocalID(),
			guid: guid,
			service: service,
			name: name,
			members: members,
			//Placeholder
			preview: {
				type: ConversationPreviewType.ChatCreation,
				date: new Date()
			},
			unreadMessages: false,
			localOnly: false
		}];
	} else {
		//Conversation not available
		return [guid, undefined];
	}
}

function unpackArray<T>(unpacker: AirUnpacker, unpackerFunction: (unpacker: AirUnpacker) => T | null): T[] {
	//Creating the array
	const array: T[] = [];

	//Reading the items
	const count = unpacker.unpackArrayHeader();
	for(let i = 0; i < count; i++) {
		const item = unpackerFunction(unpacker);
		if(item) array.push(item);
	}

	return array;
}

function unpackConversationItem(unpacker: AirUnpacker): ConversationItem | null {
	//Unpacking the shared data
	const itemType = mapCodeConversationItemType(unpacker.unpackInt());
	const serverID = unpacker.unpackLong();
	const guid = unpacker.unpackString();
	const chatGuid = unpacker.unpackString();
	const date = new Date(unpacker.unpackLong());

	switch(itemType) {
		default: {
			console.warn(`Unknown conversation item type ${itemType}`);
			return null;
		}
		case ConversationItemType.Message: {
			const text = unpacker.unpackNullableString();
			const subject = unpacker.unpackNullableString();
			const sender = unpacker.unpackNullableString();
			const attachments = unpackArray(unpacker, unpackAttachment);
			const stickers = unpackArray(unpacker, unpackModifier) as StickerItem[];
			const tapbacks = unpackArray(unpacker, unpackModifier) as TapbackItem[];
			const sendStyle = unpacker.unpackNullableString();
			const statusCode = mapCodeMessageStatus(unpacker.unpackInt());
			const errorCode = mapCodeDBError(unpacker.unpackInt());
			const error: MessageError | undefined = errorCode ? {code: errorCode} : undefined;
			const dateRead = new Date(unpacker.unpackLong());
			const editHistory = unpacker.unpackStringArray();
			const isUnsent = unpacker.unpackBoolean();

			return {
				itemType: itemType,
				serverID: serverID,
				guid: guid,
				chatGuid: chatGuid,
				date: date,

				text: text,
				subject: subject,
				sender: sender,
				attachments: attachments,
				stickers: stickers,
				tapbacks: tapbacks,
				sendStyle: sendStyle,
				status: statusCode,
				error: error,
				statusDate: dateRead,
				
				editHistory: editHistory,
				isUnsent: isUnsent
			};
		}
		case ConversationItemType.ParticipantAction: {
			const user = unpacker.unpackNullableString();
			const target = unpacker.unpackNullableString();
			const actionType = mapParticipantActionType(unpacker.unpackInt());

			return {
				itemType: itemType,
				serverID: serverID,
				guid: guid,
				chatGuid: chatGuid,
				date: date,

				type: actionType,
				user: user,
				target: target
			};
		}
		case ConversationItemType.ChatRenameAction: {
			const user = unpacker.unpackNullableString();
			const chatName = unpacker.unpackNullableString();

			return {
				itemType: itemType,
				serverID: serverID,
				guid: guid,
				chatGuid: chatGuid,
				date: date,

				user: user,
				chatName: chatName
			};
		}
	}
}

function unpackAttachment(unpacker: AirUnpacker): AttachmentItem {
	const guid = unpacker.unpackString();
	const name = unpacker.unpackString();
	const type = unpacker.unpackNullableString() ?? "application/octet-stream";
	const size = unpacker.unpackLong();
	const checksum = unpacker.unpackNullablePayload();
	const checksumString = checksum && arrayBufferToHex(checksum);
	const sort = unpacker.unpackLong();

	return {
		guid: guid,
		name: name,
		type: type,
		size: size,
		checksum: checksumString
	};
}

function unpackModifier(unpacker: AirUnpacker): MessageModifier | null {
	//Unpacking the shared data
	const type = unpacker.unpackInt();
	const messageGuid = unpacker.unpackString();

	switch(type) {
		default:
			console.warn(`Unknown modifier item type ${type}`);
			return null;
		case NSTModifierType.Activity: {
			const status = mapCodeMessageStatus(unpacker.unpackInt());
			const date = new Date(unpacker.unpackLong());

			return {
				type: MessageModifierType.StatusUpdate,
				messageGuid: messageGuid,
				status: status,
				date: date
			};
		}
		case NSTModifierType.Sticker: {
			const index = unpacker.unpackInt();
			/*const fileGUID = */unpacker.unpackString();
			const sender = unpacker.unpackNullableString();
			const date = new Date(unpacker.unpackLong());
			const data = pako.inflate(new Uint8Array(unpacker.unpackPayload()));
			const dataType = unpacker.unpackString();

			return {
				type: MessageModifierType.Sticker,
				messageGuid: messageGuid,
				messageIndex: index,
				sender: sender,
				date: date,
				dataType: dataType,
				data: data
			};
		}
		case NSTModifierType.Tapback: {
			const index = unpacker.unpackInt();
			const sender = unpacker.unpackNullableString();
			const isAddition = unpacker.unpackBoolean();
			const dbTapbackType = unpacker.unpackInt();
			const tapbackType = mapTapbackType(dbTapbackType);
			if(tapbackType === undefined) {
				console.warn(`Unknown Apple tapback type ${dbTapbackType}`);
				return null;
			}

			return {
				type: MessageModifierType.Tapback,
				messageGuid: messageGuid,
				messageIndex: index,
				sender: sender,
				isAddition: isAddition,
				tapbackType: tapbackType
			};
		}
		case NSTModifierType.Edit: {
			const editHistory = unpacker.unpackStringArray();
			const isUnsent = unpacker.unpackBoolean();
			
			return {
				type: MessageModifierType.Edit,
				messageGuid: messageGuid,
				editHistory: editHistory,
				isUnsent: isUnsent
			};
		}
	}
}

function mapCodeConversationItemType(code: number): ConversationItemType | undefined {
	switch(code) {
		case NSTConversationItemType.Message:
			return ConversationItemType.Message;
		case NSTConversationItemType.ParticipantAction:
			return ConversationItemType.ParticipantAction;
		case NSTConversationItemType.ChatRename:
			return ConversationItemType.ChatRenameAction;
		default:
			return undefined;
	}
}

function mapCodeMessageStatus(code: number): MessageStatusCode {
	switch(code) {
		default:
		case NRCMessageReceiptState.Idle:
			return MessageStatusCode.Idle;
		case NRCMessageReceiptState.Sent:
			return MessageStatusCode.Sent;
		case NRCMessageReceiptState.Delivered:
			return MessageStatusCode.Delivered;
		case NRCMessageReceiptState.Read:
			return MessageStatusCode.Read;
	}
}

function mapCodeDBError(code: number): MessageErrorCode | undefined {
	switch(code) {
		case NRCMessageDBState.OK:
			return undefined;
		case NRCMessageDBState.Unknown:
		default:
			return MessageErrorCode.ServerUnknown;
		case NRCMessageDBState.Network:
			return MessageErrorCode.AppleNetwork;
		case NRCMessageDBState.Unregistered:
			return MessageErrorCode.AppleUnregistered;
	}
}

function mapParticipantActionType(code: number): ParticipantActionType {
	switch(code) {
		case NSTGroupActionType.Unknown:
		default:
			return ParticipantActionType.Unknown;
		case NSTGroupActionType.Join:
			return ParticipantActionType.Join;
		case NSTGroupActionType.Leave:
			return ParticipantActionType.Leave;
	}
}

function mapAttachmentErrorCode(code: number): AttachmentRequestErrorCode {
	switch(code) {
		case NRCAttachmentError.NotFound:
			return AttachmentRequestErrorCode.ServerNotFound;
		case NRCAttachmentError.NotSaved:
			return AttachmentRequestErrorCode.ServerNotSaved;
		case NRCAttachmentError.Unreadable:
			return AttachmentRequestErrorCode.ServerUnreadable;
		case NRCAttachmentError.IOError:
			return AttachmentRequestErrorCode.ServerIO;
		default:
			return AttachmentRequestErrorCode.ServerUnknown;
	}
}

function mapMessageErrorCode(code: number): MessageErrorCode | undefined {
	switch(code) {
		case NRCSendResult.OK:
			return undefined;
		case NRCSendResult.ScriptError:
		case NRCSendResult.InternalError:
			return MessageErrorCode.ServerExternal;
		case NRCSendResult.BadRequest:
			return MessageErrorCode.ServerBadRequest;
		case NRCSendResult.Unauthorized:
			return MessageErrorCode.ServerUnauthorized;
		case NRCSendResult.NoConversation:
			return MessageErrorCode.AppleNoConversation;
		case NRCSendResult.RequestTimeout:
			return MessageErrorCode.ServerTimeout;
		default:
			return MessageErrorCode.ServerUnknown;
	}
}

function mapCreateChatCode(code: number): CreateChatErrorCode | undefined {
	switch(code) {
		case NRCCreateChatResult.OK:
			return undefined;
		case NRCCreateChatResult.ScriptError:
			return CreateChatErrorCode.ScriptError;
		case NRCCreateChatResult.BadRequest:
			return CreateChatErrorCode.BadRequest;
		case NRCCreateChatResult.Unauthorized:
			return CreateChatErrorCode.Unauthorized;
		case NRCCreateChatResult.NotSupported:
			return CreateChatErrorCode.NotSupported;
		default:
			return CreateChatErrorCode.UnknownExternal;
	}
}

function mapTapbackType(code: number): TapbackType | undefined {
	switch(code) {
		case 0:
			return TapbackType.Love;
		case 1:
			return TapbackType.Like;
		case 2:
			return TapbackType.Dislike;
		case 3:
			return TapbackType.Laugh;
		case 4:
			return TapbackType.Emphasis;
		case 5:
			return TapbackType.Question;
		default:
			return undefined;
	}
}

function mapUpdateErrorCode(code: number): RemoteUpdateErrorCode {
	switch(code) {
		case NRCUpdateError.Download:
			return RemoteUpdateErrorCode.Download;
		case NRCUpdateError.BadPackage:
			return RemoteUpdateErrorCode.BadPackage;
		case NRCUpdateError.Internal:
			return RemoteUpdateErrorCode.Internal;
		case NRCUpdateError.ReadOnlyVolume:
			return RemoteUpdateErrorCode.ReadOnlyVolume;
		default:
			return RemoteUpdateErrorCode.Unknown;
	}
}

function mapFaceTimeInitiateCode(code: number): FaceTimeInitiateCode {
	switch(code) {
		case NRCFaceTimeCallInitiate.OK:
			return FaceTimeInitiateCode.OK;
		case NRCFaceTimeCallInitiate.BadMembers:
			return FaceTimeInitiateCode.BadMembers;
		case NRCFaceTimeCallInitiate.AppleScriptError:
		default:
			return FaceTimeInitiateCode.External;
	}
}