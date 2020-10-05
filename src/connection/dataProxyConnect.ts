import DataProxy from "./dataProxy";

import * as CloseFrame from "./webSocketCloseEventCodes";
import * as NHT from "./nht";
import ByteBuffer from "bytebuffer";
import firebase from "firebase/app";
import "firebase/auth";

import {getInstallationID} from "../util/installationUtils";
import {ConnectionErrorCode} from "../data/stateCodes";

const connectHostname = "wss://connect.airmessage.org";
//const connectHostname = "ws://localhost:1259";

const handshakeTimeoutTime = 8 * 1000;

export default class DataProxyConnect extends DataProxy {
	private socket?: WebSocket;
	private handshakeTimeout? : NodeJS.Timeout;
	
	start(): void {
		//Getting the user's ID token
		firebase.auth().currentUser?.getIdToken().then((idToken: string) => {
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
			}
			this.socket.onmessage = (event: MessageEvent) => {
				this.handleMessage(event.data);
			}
			this.socket.onclose = (event: CloseEvent) => {
				this.notifyClose(DataProxyConnect.mapErrorCode(event.code));
			}
		}).catch((error) => {
			console.warn(error);
			this.notifyClose(ConnectionErrorCode.InternalError);
		});
	}
	
	stop(): void {
		if(!this.socket) return;
		this.socket.close();
	}
	
	send(data: ArrayBuffer): boolean {
		const byteBuffer = ByteBuffer.allocate(4 + data.byteLength)
			.writeInt(NHT.nhtClientProxy)
			.append(data);
		
		if(!this.socket) return false;
		this.socket.send(byteBuffer.flip().toArrayBuffer());
		return true;
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
				//Reading the data
				const data = byteBuffer.compact().toArrayBuffer();
				
				//Handling the message
				this.notifyMessage(data);
				
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
			case NHT.closeCodeNoSubscription:
				return ConnectionErrorCode.ConnectNoSubscription;
			case NHT.closeCodeOtherLocation:
				return ConnectionErrorCode.ConnectOtherLocation;
			default:
				return ConnectionErrorCode.ExternalError;
		}
	}
}