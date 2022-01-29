import DataProxy from "shared/connection/dataProxy";
import {ConnectionErrorCode} from "shared/data/stateCodes";
import ByteBuffer from "bytebuffer";
import {decryptData, encryptData} from "shared/util/encryptionUtils";
import {getSecureLS, SecureStorageKey} from "shared/util/secureStorageUtils";
import {decodeBase64, encodeBase64} from "shared/util/dataHelper";
import {windowsServerConnect, windowsServerDisconnect, windowsServerSend} from "../private/interopUtils";
import {ChromeEventListener} from "../../../window";
import TaskQueue from "shared/util/taskQueue";

interface AddressData {
	host: string;
	port: number;
}

interface AddressOverride {
	primary: string;
	fallback?: string;
}

//A regex that determines if an address contains a valid port
const regexPort = /(:([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]?))$/;

/**
 * Parses a string address to its hostname and port components
 */
function parseAddress(address: string): AddressData {
	if(regexPort.test(address)) {
		const split = address.split(":");
		return {host: split[0], port: parseInt(split[1])};
	} else {
		return {host: address, port: 1359};
	}
}

export default class DataProxyTCP extends DataProxy {
	proxyType = "Direct";
	private readonly override: AddressOverride | undefined;
	private isStopping = false;
	private readonly taskQueueEncrypt = new TaskQueue();
	private readonly taskQueueDecrypt = new TaskQueue();
	
	constructor(override?: AddressOverride) {
		super();
		
		this.override = override;
	}
	
	async send(data: ArrayBuffer, encrypt: boolean) {
		this.taskQueueEncrypt.enqueue(async () => {
			if(encrypt) {
				data = await encryptData(data);
			}
			
			this.writeSync(data, encrypt);
		});
	}
	
	//Writes data to the socket without any sort of processing
	private writeSync(data: ArrayBuffer, isEncrypted: boolean) {
		const byteBuffer = ByteBuffer.allocate(4 + 1 + data.byteLength)
			.writeInt(data.byteLength)
			.writeByte(isEncrypted ? 1 : 0)
			.append(data);
		
		windowsServerSend(encodeBase64(byteBuffer.buffer));
	}
	
	//previousDecrypt ensures that all read messages are decrypted in parallel
	async start(): Promise<void> {
		//Resetting the isStopping flag
		this.isStopping = true;
		
		//Reading address data
		let addressPrimary: AddressData;
		let addressSecondary: AddressData | undefined;
		
		if(this.override !== undefined) {
			addressPrimary = parseAddress(this.override.primary);
			addressSecondary = this.override.fallback ? parseAddress(this.override.fallback) : undefined;
		} else {
			const addressPrimaryStr = await getSecureLS(SecureStorageKey.ServerAddress);
			if(addressPrimaryStr === undefined) {
				this.notifyClose(ConnectionErrorCode.Connection);
				return;
			}
			addressPrimary = parseAddress(addressPrimaryStr);
			
			const addressSecondaryStr = await getSecureLS(SecureStorageKey.ServerAddressFallback);
			if(addressSecondaryStr !== undefined) {
				addressSecondary = parseAddress(addressSecondaryStr);
			}
		}
		
		windowsServerConnect(addressPrimary.host, addressPrimary.port);
		
		const chromeEventListener: ChromeEventListener = (event) => {
			const message = event.data;
			console.log("Received chrome message", message);
			
			switch(message.type) {
				case "connect": {
					this.notifyOpen();
					
					break;
				}
				case "disconnect": {
					//Connect using fallback parameters if we haven't been asked to disconnect
					if(!this.isStopping && addressSecondary !== undefined) {
						windowsServerConnect(addressSecondary.host, addressSecondary.port);
					} else {
						window.chrome.webview.removeEventListener("message", chromeEventListener);
						this.notifyClose(ConnectionErrorCode.Connection);
					}
					
					break;
				}
				case "message": {
					let data = decodeBase64(message.data);
					const isEncrypted = message.isEncrypted;
					
					//Submitting the message
					this.taskQueueDecrypt.enqueue(async () => {
						if(isEncrypted) data = await decryptData(data);
						this.notifyMessage(data, isEncrypted);
					});
					
					break;
				}
			}
		};
		window.chrome.webview.addEventListener("message", chromeEventListener);
	}
	
	stop(): void {
		//Setting the isStopping flag, so we don't try to create any more connections
		this.isStopping = true;
		
		//Closing the socket
		windowsServerDisconnect();
	}
}
