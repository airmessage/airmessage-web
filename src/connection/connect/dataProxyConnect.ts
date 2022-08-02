import DataProxy from "shared/connection/dataProxy";

import * as CloseFrame from "./webSocketCloseEventCodes";
import * as NHT from "./nht";
import ByteBuffer from "bytebuffer";
import {getAuth, getIdToken} from "firebase/auth";
import {getInstallationID} from "shared/util/installationUtils";
import {ConnectionErrorCode} from "shared/data/stateCodes";
import {connectHostname} from "shared/secrets";
import {decryptData, encryptData, isCryptoPasswordAvailable} from "shared/util/encryptionUtils";
import TaskQueue from "shared/util/taskQueue";

const handshakeTimeoutTime = 8 * 1000;

export default class DataProxyConnect extends DataProxy {
	proxyType = "Connect";
	
	private readonly taskQueueEncrypt = new TaskQueue();
	private readonly taskQueueDecrypt = new TaskQueue();
	
	private socket: WebSocket | undefined;
	private handshakeTimeout: ReturnType<typeof setTimeout> | undefined;
	
	start(): void {
		//Getting the user's ID token
		getIdToken(getAuth().currentUser!).then((idToken: string) => {
			//Building the URL
			const url = new URL(connectHostname);
			url.searchParams.set("communications", String(NHT.commVer));
			url.searchParams.set("is_server", String(false));
			url.searchParams.set("installation_id", getInstallationID());
			url.searchParams.set("id_token", idToken);
			
			//Starting the WebSocket connection
			this.socket = new WebSocket(url.toString());
			this.socket.binaryType = "arraybuffer";
			
			//Registering the listeners
			this.socket.onopen = () => {
				//Starting the handshake expiry timer
				this.handshakeTimeout = setTimeout(this.handleHandshakeTimeout, handshakeTimeoutTime);
			};
			this.socket.onmessage = (event: MessageEvent) => {
				this.handleMessage(event.data);
			};
			this.socket.onclose = (event: CloseEvent) => {
				this.notifyClose(DataProxyConnect.mapErrorCode(event.code));
			};
		}).catch((error) => {
			console.warn(error);
			this.notifyClose(ConnectionErrorCode.InternalError);
		});
	}
	
	stop(): void {
		if(!this.socket) return;
		this.socket.close();
	}
	
	send(data: ArrayBuffer, encrypt: boolean) {
		this.taskQueueEncrypt.enqueue(async () => {
			//Check for encryption support
			const supportsEncryption = this.serverRequestsEncryption;
			if(supportsEncryption && !isCryptoPasswordAvailable()) {
				throw new Error("The server requests encryption, but no password is set");
			}
			
			//Get whether we should encrypt this packet
			const isEncrypted = encrypt && supportsEncryption;
			if(isEncrypted) {
				data = await encryptData(data);
			}
			
			const byteBuffer = ByteBuffer.allocate(1 + 4 + data.byteLength);
			byteBuffer.writeInt(NHT.nhtClientProxy);
			
			if(isEncrypted) byteBuffer.writeByte(-100); //The content is encrypted
			else if(supportsEncryption) byteBuffer.writeByte(-101); //We support encryption, but this packet should not be encrypted
			else byteBuffer.writeByte(-102); //We don't support encryption
			
			byteBuffer.append(data);
			
			if(!this.socket) return;
			this.socket.send(byteBuffer.flip().toArrayBuffer());
		});
	}
	
	sendTokenAdd(token: string) {
		const byteBuffer = new ByteBuffer()
			.writeInt(NHT.nhtClientAddFCMToken)
			.writeString(token);
		
		this.socket!.send(byteBuffer.flip().toArrayBuffer());
	}
	
	sendTokenRemove(token: string) {
		const byteBuffer = new ByteBuffer()
			.writeInt(NHT.nhtClientRemoveFCMToken)
			.writeString(token);
		
		this.socket!.send(byteBuffer.flip().toArrayBuffer());
	}
	
	private handleMessage(data: ArrayBuffer) {
		//Wrapping the data
		const byteBuffer = ByteBuffer.wrap(data);
		
		//Unpacking the message
		const type = byteBuffer.readInt();
		
		switch(type) {
			case NHT.nhtConnectionOK: {
				//Cancelling the handshake expiry timer
				clearTimeout(this.handshakeTimeout!);
				
				//Calling the listener
				this.notifyOpen();
				
				break;
			}
			case NHT.nhtClientProxy: {
				/*
				 * -100 -> The content is encrypted
				 * -101 -> The content is not encrypted, but the server has encryption enabled
				 * -102 -> The server has encryption disabled
				 */
				let isSecure: boolean, isEncrypted: boolean;
				const encryptionValue = byteBuffer.readByte();
				if(encryptionValue === -100) isSecure = isEncrypted = true;
				else if(encryptionValue === -101) isSecure = isEncrypted = false;
				else if(encryptionValue === -102) {
					isSecure = true;
					isEncrypted = false;
				} else {
					throw new Error("Received unknown encryption value: " + encryptionValue);
				}
				
				//Reading the data
				let data = byteBuffer.compact().toArrayBuffer();
				
				if(isCryptoPasswordAvailable()) {
					this.taskQueueDecrypt.enqueue(async () => {
						if(isEncrypted) data = await decryptData(data);
						this.notifyMessage(data, isSecure);
					});
				} else {
					//Handling the message right away
					this.notifyMessage(data, isSecure);
				}
				
				break;
			}
		}
	}
	
	//Called when the handshake timeout is triggered
	private handleHandshakeTimeout() {
		//Disconnecting
		this.stop();
	}
	
	//Map a WebSocket (or AirMessage Connect) error code to a local ConnectionCode
	private static mapErrorCode(wsCode: number): ConnectionErrorCode {
		switch(wsCode) {
			case CloseFrame.NORMAL_CLOSURE:
			case CloseFrame.ABNORMAL_CLOSURE:
				return ConnectionErrorCode.Internet;
			case CloseFrame.PROTOCOL_ERROR:
			case CloseFrame.POLICY_VIOLATION:
				return ConnectionErrorCode.BadRequest;
			case NHT.closeCodeIncompatibleProtocol:
				return ConnectionErrorCode.ClientOutdated;
			case NHT.closeCodeNoGroup:
				return ConnectionErrorCode.ConnectNoGroup;
			case NHT.closeCodeNoCapacity:
				return ConnectionErrorCode.ConnectNoCapacity;
			case NHT.closeCodeAccountValidation:
				return ConnectionErrorCode.ConnectAccountValidation;
			case NHT.closeCodeNoActivation:
				return ConnectionErrorCode.ConnectNoActivation;
			case NHT.closeCodeOtherLocation:
				return ConnectionErrorCode.ConnectOtherLocation;
			default:
				return ConnectionErrorCode.ExternalError;
		}
	}
}