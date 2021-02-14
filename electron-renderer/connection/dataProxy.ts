import DataProxy from "shared/connection/dataProxy";
import "firebase/auth";
import {ConnectionErrorCode} from "shared/data/stateCodes";
import ByteBuffer from "bytebuffer";
import {decryptData, encryptData} from "shared/util/encryptionUtils";

const net = require("net");

export default class DataProxyTCP extends DataProxy {
	private socket = new net.Socket();
	
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
		const byteBuffer = ByteBuffer.allocate(4 * 2 + data.byteLength)
			.writeInt(data.byteLength)
			.writeByte(isEncrypted ? 1 : 0)
			.append(data);
		
		this.socket.write(byteBuffer.buffer);
	}
	
	//previousDecrypt ensures that all read messages are decrypted in parallel
	private previousDecrypt: Promise<any> | undefined;
	start(): void {
		this.socket.connect(1359, "localhost");
		
		let messageData: {size: number, isEncrypted: boolean} | undefined = undefined;
		this.socket.on("connect", () => {
			this.notifyOpen();
		});
		this.socket.on("close", () => {
			this.notifyClose(ConnectionErrorCode.Connection);
		});
		this.socket.on("readable", async () => {
			while(true) {
				if(messageData === undefined) {
					//Reading the message data
					const data: Buffer = this.socket.read(4 + 1);
					if(!data) break;
					
					//Setting the message data
					const size = data.readInt32BE(0);
					const isEncrypted = data[4] !== 0;
					messageData = {size: size, isEncrypted: isEncrypted};
				} else {
					//Reading the message contents
					const data: Buffer = this.socket.read(messageData.size);
					if(!data) break;
					
					//Submitting the message
					if(this.previousDecrypt) {
						const isEncrypted = messageData.isEncrypted;
						
						this.previousDecrypt = this.previousDecrypt.then(async () => {
							//Decrypting the data if necessary
							if(isEncrypted) {
								this.notifyMessage(await decryptData(data), true);
							} else {
								this.notifyMessage(data, false);
							}
						});
					} else {
						//Decrypting the data if necessary
						if(messageData.isEncrypted) {
							this.notifyMessage(await (this.previousDecrypt = decryptData(data)), true);
						} else {
							this.notifyMessage(data, false);
						}
					}
					
					//Invalidating the message data
					messageData = undefined;
				}
			}
		});
	}
	
	stop(): void {
		this.socket.end(() => this.socket.destroy());
	}
}