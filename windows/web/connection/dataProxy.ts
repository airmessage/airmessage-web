import DataProxy from "shared/connection/dataProxy";
import {ConnectionErrorCode} from "shared/data/stateCodes";
import ByteBuffer from "bytebuffer";
import {decryptData, encryptData} from "shared/util/encryptionUtils";
import {getSecureLS, SecureStorageKey} from "shared/util/secureStorageUtils";
import {decodeBase64, encodeBase64} from "shared/util/dataHelper";

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
	private readonly override: AddressOverride | undefined;
	private isStopping = false;
	
	constructor(override?: AddressOverride) {
		super();
		
		this.override = override;
	}
	
	//previousEncrypt ensures that all send messages are sent in parallel
	private previousEncrypt: Promise<any> | undefined;
	async send(data: ArrayBuffer, encrypt: boolean) {
		if(this.previousEncrypt) {
			this.previousEncrypt = this.previousEncrypt.then(async () => {
				//Encrypting the data if necessary
				if(encrypt) {
					this.writeSync(await encryptData(data), true);
				} else {
					this.writeSync(data, false);
				}
			});
		} else {
			//Encrypting the data if necessary
			if(encrypt) {
				this.writeSync(await (this.previousEncrypt = encryptData(data)), true);
			} else {
				this.writeSync(data, false);
			}
		}
	}
	
	//Writes data to the socket without any sort of processing
	private writeSync(data: ArrayBuffer, isEncrypted: boolean) {
		const byteBuffer = ByteBuffer.allocate(4 + 1 + data.byteLength)
			.writeInt(data.byteLength)
			.writeByte(isEncrypted ? 1 : 0)
			.append(data);
		
		window.chrome.webview.hostObjects.connection.Send(encodeBase64(byteBuffer.buffer));
	}
	
	//previousDecrypt ensures that all read messages are decrypted in parallel
	private previousDecrypt: Promise<any> | undefined;
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
		
		await window.chrome.webview.hostObjects.connection.Connect({hostname: addressPrimary.host, port: addressPrimary.port});
		
		window.chrome.webview.addEventListener("message", (message) => {
			switch(message.type) {
				case "connect": {
					this.notifyOpen();
					
					break;
				}
				case "disconnect": {
					//Connect using fallback parameters if we haven't been asked to disconnect
					if(!this.isStopping && addressSecondary !== undefined) {
						window.chrome.webview.hostObjects.connection.Connect({hostname: addressSecondary.host, port: addressSecondary.port});
					} else {
						this.notifyClose(ConnectionErrorCode.Connection);
					}
					
					break;
				}
				case "message": {
					const data = decodeBase64(message.data.data);
					const isEncrypted = message.data.isEncrypted;
					
					//Submitting the message
					if(this.previousDecrypt) {
						this.previousDecrypt = this.previousDecrypt.then(() => {
							//Decrypting the data if necessary
							if(isEncrypted) {
								decryptData(data).then((data) => this.notifyMessage(data, true));
							} else {
								this.notifyMessage(data, false);
							}
						});
					} else {
						//Decrypting the data if necessary
						if(isEncrypted) {
							(this.previousDecrypt = decryptData(data)).then((data) => this.notifyMessage(data, true));
						} else {
							this.notifyMessage(data, false);
						}
					}
					
					break;
				}
			}
		});
	}
	
	stop(): void {
		//Setting the isStopping flag, so we don't try to create any more connections
		this.isStopping = true;
		
		//Closing the socket
		window.chrome.webview.hostObjects.connection.Disconnect();
	}
}
