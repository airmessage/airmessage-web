import DataProxy from "./dataProxy";

import * as CloseFrame from "./webSocketCloseEventCodes";
import * as NHT from "./nht";
import ByteBuffer from "bytebuffer";
import firebase from "firebase/app";
import "firebase/auth";

import {communicationsVersion} from "./connectionConstants";
import {getInstallationID} from "../util/installationUtils";
import {ConnectionErrorCode} from "../data/stateCodes";
import {cookieDomain} from "../util/cookieUtils";

const connectHostname = "wss://connect.airmessage.org";
//const connectHostname = "ws://localhost:1259";

const handshakeTimeoutTime = 8 * 1000;

export default class DataProxyConnect extends DataProxy {
	private socket?: WebSocket;
	private handshakeTimeout? : NodeJS.Timeout;
	
	start(): void {
		//Getting the user's ID token
		firebase.auth().currentUser?.getIdToken().then((idToken: string) => {
			//Assigning other temporary Connect cookies
			//these cookies get cleared on browser restart
			document.cookie = `communications=${NHT.commVer}; domain=${cookieDomain}`;
			document.cookie = `isServer=${false}; domain=${cookieDomain}`;
			document.cookie = `idToken=${idToken}; domain=${cookieDomain}`;
			getInstallationID(); //This function saves the installation ID to cookies for us
			
			//Starting the WebSocket connection
			this.socket = new WebSocket(connectHostname);
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
		}).catch((error: Error) => {
			this.notifyClose(communicationsVersion)
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
				return ConnectionErrorCode.BadRequest;
			case CloseFrame.POLICY_VIOLATION:
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