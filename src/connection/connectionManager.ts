import DataProxyImpl from "platform-components/connection/dataProxy";
import CommunicationsManager, {CommunicationsManagerListener} from "./communicationsManager";
import ClientComm5 from "./comm5/clientComm5";
import DataProxy from "./dataProxy";
import * as Blocks from "../data/blocks";
import {Conversation, ConversationItem, MessageModifier} from "../data/blocks";
import {
	AttachmentRequestErrorCode,
	ConnectionErrorCode,
	CreateChatErrorCode,
	MessageError,
	MessageErrorCode
} from "../data/stateCodes";
import EventEmitter from "../util/eventEmitter";
import ProgressPromise from "../util/progressPromise";
import promiseTimeout from "../util/promiseTimeout";
import {TransferAccumulator} from "./transferAccumulator";
import {isCryptoPasswordSet, setCryptoPassword} from "shared/util/encryptionUtils";
import {getSecureLS, SecureStorageKey} from "shared/util/secureStorageUtils";
import FileDownloadResult from "shared/data/fileDownloadResult";

export const targetCommVer = "5.4";

//How often to try reconnecting when disconnected
const reconnectInterval = 8 * 1000;
const requestTimeoutMillis = 10 * 1000;

type ConnectionState = "disconnected" | "connecting" | "connected";

//Server information
let _serverSystemVersion: string | undefined;
export function getServerSystemVersion(): string | undefined {
	return _serverSystemVersion;
}
let _serverSoftwareVersion: string | undefined;
export function getServerSoftwareVersion(): string | undefined {
	return _serverSoftwareVersion;
}

//Communications manager constructor shape
interface CreatesCommunicationsManager {
	new(dataProxy: DataProxy): CommunicationsManager
}

//Connection values
const communicationsPriorityList: ReadonlyArray<CreatesCommunicationsManager> = [ClientComm5];
let reconnectTimeoutID: any | undefined;

let communicationsManager: CommunicationsManager | null = null;
let dataProxy: DataProxy = new DataProxyImpl();
export function setDataProxy(value: DataProxy) {
	dataProxy = value;
}

//Config values
let disableAutomaticReconnections = false;
export function setDisableAutomaticReconnections(value: boolean) {
	disableAutomaticReconnections = value;
}

//Listener values
export interface ConnectionListener {
	onConnecting: () => void;
	onOpen: () => void;
	onClose: (reason: ConnectionErrorCode) => void;
}
const connectionListenerArray: ConnectionListener[] = [];

//Promise response values
interface PromiseExecutor<T> {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}
interface ProgressPromiseExecutor<T, P> {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
	progress: (progress: P) => void;
}

const liteConversationPromiseArray: PromiseExecutor<Blocks.Conversation[]>[] = []; //Retrieval of all lite conversations
interface ThreadKey {
	chatGUID: string;
	firstMessageID?: number;
}
const conversationDetailsPromiseMap: Map<string, PromiseExecutor<[string, Conversation | undefined][]>[]> = new Map(); //Retrieval of a specific conversation's details
const threadPromiseMap: Map<string, PromiseExecutor<Blocks.ConversationItem[]>[]> = new Map(); //Retrieval of messages from a thread

class FileDownloadState {
	private accumulator?: TransferAccumulator;
	public get accumulatedData() {
		return this.accumulator!.data;
	}
	public get accumulatedDataOffset() {
		return this.accumulator!.offset;
	}
	promise: ProgressPromiseExecutor<FileDownloadResult, FileDownloadProgress>;
	private readonly timeoutCallback: () => void;
	
	private timeoutID: any | undefined;
	
	public downloadFileName: string | undefined = undefined;
	public downloadFileType: string | undefined = undefined;
	
	constructor(promise: ProgressPromiseExecutor<FileDownloadResult, FileDownloadProgress>, timeoutCallback: () => void) {
		this.promise = promise;
		this.timeoutCallback = timeoutCallback;
	}
	
	public initializeAccumulator(accumulator: TransferAccumulator) {
		//Setting the accumulator
		this.accumulator = accumulator;
		
		this.refreshTimeout();
	}
	
	public appendData(data: ArrayBuffer) {
		//Adding the data to the array
		this.accumulator!.push(data);
		
		this.refreshTimeout();
	}
	
	public finish() {
		if(this.timeoutID) clearTimeout(this.timeoutID);
	}
	
	private refreshTimeout() {
		if(this.timeoutID) clearTimeout(this.timeoutID);
		this.timeoutID = setTimeout(this.timeoutCallback, requestTimeoutMillis);
	}
}

interface FileDownloadProgress {
	type: "size" | "downloaded";
	value: number;
}
const fileDownloadStateMap: Map<number, FileDownloadState> = new Map(); //Attachment data retrieval
const messageSendPromiseMap: Map<number, PromiseExecutor<any>> = new Map(); //Response from sending a message
const chatCreatePromiseMap: Map<number, PromiseExecutor<string>> = new Map(); //Response from creating a chat

export const messageUpdateEmitter: EventEmitter<ConversationItem[]> = new EventEmitter();
export const modifierUpdateEmitter: EventEmitter<MessageModifier[]> = new EventEmitter();

//Common promise responses
const messageErrorNetwork: MessageError = {code: MessageErrorCode.LocalNetwork};

//State values
let connState: ConnectionState = "disconnected";
let isConnectingPassively = false;
let lastServerMessageID: number | undefined = undefined;
let lastConnectionUpdateTime: Date | undefined = undefined; //The last time the client received a message from the server
let nextRequestID: number = 0;

function onOnline() {
	//Reconnecting
	connect();
}

function onOffline() {
	//Disconnecting
	disconnect();
}

const communicationsManagerListener: CommunicationsManagerListener = {
	onOpen(systemVersion: string, softwareVersion: string): void {
		//Updating the state
		updateStateConnected();
		
		//Recording the server information
		_serverSystemVersion = systemVersion;
		_serverSoftwareVersion = softwareVersion;
		
		//Listening for network events
		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);
	}, onClose(reason: ConnectionErrorCode): void {
		//Failing all pending promises
		rejectAndClear(liteConversationPromiseArray, messageErrorNetwork);
		rejectAndClear(conversationDetailsPromiseMap, messageErrorNetwork);
		rejectAndClear(threadPromiseMap, messageErrorNetwork);
		for(const state of fileDownloadStateMap.values()) state.promise.reject(AttachmentRequestErrorCode.Timeout);
		fileDownloadStateMap.clear();
		for(const promise of messageSendPromiseMap.values()) promise.reject(messageErrorNetwork);
		messageSendPromiseMap.clear();
		for(const promise of chatCreatePromiseMap.values()) promise.reject([CreateChatErrorCode.Network, undefined]);
		chatCreatePromiseMap.clear();
		
		//Updating the state
		updateStateDisconnected(reason);
		
		//Checking if the error is automatically recoverable
		if((reason === ConnectionErrorCode.Connection || reason === ConnectionErrorCode.Internet) && !disableAutomaticReconnections) {
			//Scheduling a passive reconnection
			reconnectTimeoutID = setTimeout(() => {
				if(!disableAutomaticReconnections) {
					connectPassive();
				}
			}, reconnectInterval);
		}
		
		//Removing the network event listeners
		window.removeEventListener("online", onOnline);
		window.removeEventListener("offline", onOffline);
	}, onPacket(): void {
		if(connState === "connected") {
			//Recording the last connection update time
			lastConnectionUpdateTime = new Date();
		}
	}, onMessageUpdate(data: ConversationItem[]): void {
		//Notifying the listeners
		messageUpdateEmitter.notify(data);
	}, onConversationUpdate(data: [string, Conversation | undefined][]): void {
		//Resolving pending promises
		const promiseMapKey = data.map(data => data[0]).join(" ");
		const promiseArray = conversationDetailsPromiseMap.get(promiseMapKey);
		if(promiseArray) {
			for(const promise of promiseArray) promise.resolve(data);
			threadPromiseMap.delete(promiseMapKey);
		}
	}, onModifierUpdate(data: MessageModifier[]): void {
		//Notifying the listeners
		modifierUpdateEmitter.notify(data);
	}, onFileRequestStart(requestID, downloadFileName, downloadFileType, dataLength, accumulator) {
		//Finding the local request
		const state = fileDownloadStateMap.get(requestID);
		if(!state) return;
		
		//Setting the download file information
		state.downloadFileName = downloadFileName;
		state.downloadFileType = downloadFileType;
		
		//Setting the accumulator
		state.initializeAccumulator(accumulator);
		
		//Updating the progress
		state.promise.progress({type: "size", value: dataLength});
	}, onFileRequestData(requestID: number, data: ArrayBuffer): void {
		//Finding the local request
		const state = fileDownloadStateMap.get(requestID);
		if(!state) return;
		
		//Adding the data
		state.appendData(data);
		
		//Updating the progress
		state.promise.progress({type: "downloaded", value: state.accumulatedDataOffset});
	}, onFileRequestComplete(requestID: number): void {
		//Finding the local request
		const state = fileDownloadStateMap.get(requestID);
		if(!state) return;
		
		//Finishing the request
		state.finish();
		state.promise.resolve({
			data: state.accumulatedData,
			downloadName: state.downloadFileName,
			downloadType: state.downloadFileType,
		});
		
		//Removing the request
		fileDownloadStateMap.delete(requestID);
	}, onFileRequestFail(requestID: number, error: AttachmentRequestErrorCode): void {
		//Finding the local request
		const state = fileDownloadStateMap.get(requestID);
		if(!state) return;
		
		//Failing the request
		state.promise.reject(error);
		
		//Removing the request
		fileDownloadStateMap.delete(requestID);
	}, onIDUpdate(messageID: number): void {
		//Recording the last message ID
		lastServerMessageID = messageID;
	},
	onMessageConversations(data: Conversation[]): void {
		//Resolving pending promises
		for(const promise of liteConversationPromiseArray) promise.resolve(data);
		
		//Emptying the array
		liteConversationPromiseArray.length = 0;
	}, onMessageThread(chatGUID: string, firstMessageID: number | undefined, data: ConversationItem[]) {
		//Resolving pending promises
		const promiseMapKey = JSON.stringify({chatGUID: chatGUID, firstMessageID: firstMessageID} as ThreadKey);
		const promiseArray = threadPromiseMap.get(promiseMapKey);
		if(promiseArray) {
			for(const promise of promiseArray) promise.resolve(data);
			threadPromiseMap.delete(promiseMapKey);
		}
	}, onSendMessageResponse(requestID: number, error: MessageError | undefined): void {
		//Resolving pending promises
		const promise = messageSendPromiseMap.get(requestID);
		if(!promise) return;
		
		if(error) promise.reject(error);
		else promise.resolve(undefined);
		
		chatCreatePromiseMap.delete(requestID);
	}, onCreateChatResponse(requestID: number, error: CreateChatErrorCode | undefined, details: string | undefined): void {
		//Resolving pending promises
		const promise = chatCreatePromiseMap.get(requestID);
		if(!promise) return;
		
		if(error === undefined) {
			if(details) {
				promise.resolve(details);
			} else {
				promise.reject([CreateChatErrorCode.Network, undefined]);
			}
		} else {
			promise.reject([error, details]);
		}
		
		chatCreatePromiseMap.delete(requestID);
	}
};

function updateStateDisconnected(reason: ConnectionErrorCode) {
	connState = "disconnected";
	for(const listener of connectionListenerArray) listener.onClose(reason);
}

function updateStateConnecting() {
	connState = "connecting";
	for(const listener of connectionListenerArray) listener.onConnecting();
}

function updateStateConnected() {
	connState = "connected";
	for(const listener of connectionListenerArray) listener.onOpen();
}

function generateRequestID(): number {
	//Recording the next request ID
	const requestID = nextRequestID;
	
	//Increasing the request ID (and overflowing at Java's max short value)
	if(nextRequestID === 32767) nextRequestID = -32768;
	else nextRequestID++;
	
	//Returning the request ID
	return requestID;
}

export async function connect() {
	//Load the password if it hasn't been loaded yet
	if(!isCryptoPasswordSet()) {
		try {
			await setCryptoPassword(await getSecureLS(SecureStorageKey.ServerPassword));
		} catch(error) {
			console.warn(error);
		}
	}
	
	//Checking if a passive reconnection is in progress
	if(isConnectingPassively) {
		//Bringing the state from passive to the foreground
		updateStateConnecting();
		isConnectingPassively = false;
		
		return;
	}
	
	//Cancelling the reconnect timeout if it's running
	if(reconnectTimeoutID) {
		clearTimeout(reconnectTimeoutID);
		reconnectTimeoutID = undefined;
	}
	
	//Setting the state to connecting
	updateStateConnecting();
	
	//Connecting from the top of the priority list
	connectFromList(0);
}

function connectPassive() {
	//Recording the state
	isConnectingPassively = true;
	
	//Clearing the timeout ID (this function can only be called when the timer expires)
	reconnectTimeoutID = undefined;
	
	//Connecting from the top of the priority list
	connectFromList(0);
}

function connectFromList(index: number) {
	communicationsManager = new communicationsPriorityList[index](dataProxy);
	communicationsManager.listener = communicationsManagerListener;
	communicationsManager.connect();
}

export function disconnect() {
	communicationsManager?.disconnect(ConnectionErrorCode.Internet);
}

export function isConnected(): boolean {
	return connState === "connected";
}

export function isDisconnected(): boolean {
	return connState === "disconnected";
}

function requestTimeoutMap<T, K>(key: K, map: Map<K, any>, timeoutReason: any | undefined = messageErrorNetwork, promise: Promise<T>): Promise<T> {
	const timedPromise = promiseTimeout(requestTimeoutMillis, timeoutReason, promise);
	timedPromise.catch(() => map.delete(key)); //Remove the promise from the map on error
	return timedPromise;
}

function requestTimeoutArray<T, K>(array: K[], timeoutReason: any | undefined = messageErrorNetwork, promise: Promise<T>): Promise<T> {
	const timedPromise = promiseTimeout(requestTimeoutMillis, timeoutReason, promise);
	timedPromise.catch(() => array.length = 0); //Clear the array on error
	return timedPromise;
}

export function sendMessage(chatGUID: string, message: string): Promise<any> {
	//Failing immediately if there is no network connection
	if(!isConnected()) return Promise.reject(messageErrorNetwork);
	
	//Starting a new promise
	const requestID = generateRequestID();
	return requestTimeoutMap(requestID, messageSendPromiseMap, undefined, new Promise<any>((resolve, reject) => {
		//Sending the request
		communicationsManager!.sendMessage(requestID, chatGUID, message);
		
		//Recording the promise
		messageSendPromiseMap.set(requestID, {resolve: resolve, reject: reject});
	}));
}

export function sendFile(chatGUID: string, file: File): ProgressPromise<any, string | number> {
	//Failing immediately if there is no network connection
	if(!isConnected()) return Promise.reject(messageErrorNetwork) as ProgressPromise<any, string | number>;
	
	//Starting a new promise
	return new ProgressPromise<any, string | number>((resolve, reject, progress) => {
		const requestID = generateRequestID();
		
		//Sending the request
		communicationsManager!.sendFile(requestID, chatGUID, file, progress)
			.then((value) => {
				//Forwarding the value to the promise
				progress(value);
				
				//Starting a timeout for the server response
				setTimeout(reject, requestTimeoutMillis);
			})
			.catch((error) => {
				//Forwarding the value to the promise
				reject(error);
				
				//Removing this promise from the map
				messageSendPromiseMap.delete(requestID);
			});
		
		//Recording the promise
		messageSendPromiseMap.set(requestID, {resolve: resolve, reject: reject});
	});
}

export function fetchConversations(): Promise<Blocks.Conversation[]> {
	//Failing immediately if there is no network connection
	if(!isConnected()) return Promise.reject(messageErrorNetwork);
	
	//Starting a new promise
	return requestTimeoutArray(liteConversationPromiseArray, undefined, new Promise<Blocks.Conversation[]>((resolve, reject) => {
		//Sending the request
		communicationsManager!.requestLiteConversations();
		
		//Recording the promise
		liteConversationPromiseArray.push({resolve: resolve, reject: reject});
	}));
}

export function fetchConversationInfo(chatGUIDs: string[]): Promise<[string, Conversation | undefined][]> {
	//Failing immediately if there is no network connection
	if(!isConnected()) return Promise.reject(messageErrorNetwork);
	
	//Starting a new promise
	const key = chatGUIDs.join(" ");
	return requestTimeoutMap(key, conversationDetailsPromiseMap, undefined, new Promise<[string, Conversation | undefined][]>((resolve, reject) => {
		//Sending the request
		communicationsManager!.requestConversationInfo(chatGUIDs);
		
		//Recording the promise
		pushKeyedArray(conversationDetailsPromiseMap, key, {resolve: resolve, reject: reject});
	}));
}

export function fetchThread(chatGUID: string, firstMessageID?: number): Promise<Blocks.ConversationItem[]> {
	//Failing immediately if there is no network connection
	if(!isConnected()) return Promise.reject(messageErrorNetwork);
	
	//Starting a new promise
	const key = JSON.stringify({chatGUID: chatGUID, firstMessageID: firstMessageID} as ThreadKey);
	return requestTimeoutMap(key, threadPromiseMap, undefined, new Promise<Blocks.ConversationItem[]>((resolve, reject) => {
		//Sending the request
		communicationsManager!.requestLiteThread(chatGUID, firstMessageID);
		
		//Recording the promise
		pushKeyedArray(threadPromiseMap, key, {resolve: resolve, reject: reject});
	}));
}

export function fetchAttachment(attachmentGUID: string): ProgressPromise<FileDownloadResult, FileDownloadProgress> {
	//Failing immediately if there is no network connection
	if(!isConnected()) return ProgressPromise.reject(AttachmentRequestErrorCode.Timeout) as ProgressPromise<FileDownloadResult, FileDownloadProgress>;
	
	//Starting a new promise
	return new ProgressPromise<FileDownloadResult, FileDownloadProgress>((resolve, reject, progress) => {
		const requestID = generateRequestID();
		
		//Sending the request
		communicationsManager!.requestAttachmentDownload(requestID, attachmentGUID);
		
		//Recording the promise
		fileDownloadStateMap.set(requestID, new FileDownloadState({resolve: resolve, reject: reject, progress: progress}, () => {
			//Removing and rejecting the promise
			fileDownloadStateMap.delete(requestID);
			reject();
		}));
	});
}

export function createChat(members: string[], service: string): Promise<string> {
	//Failing immediately if there is no network connection
	if(!isConnected()) return Promise.reject([CreateChatErrorCode.Network, undefined]);
	
	//Starting a new promise
	const requestID = generateRequestID();
	return requestTimeoutMap(requestID, chatCreatePromiseMap, [CreateChatErrorCode.Network, undefined], new Promise<string>((resolve, reject) => {
		//Sending the request
		communicationsManager!.requestChatCreation(requestID, members, service);
		
		//Recording the promise
		chatCreatePromiseMap.set(requestID, {resolve: resolve, reject: reject});
	}));
}

export function requestMissedMessages() {
	if(lastServerMessageID !== undefined && lastConnectionUpdateTime !== undefined) {
		communicationsManager!.requestRetrievalID(lastServerMessageID, lastConnectionUpdateTime, new Date());
	} else if(lastConnectionUpdateTime !== undefined) {
		communicationsManager!.requestRetrievalTime(lastConnectionUpdateTime, new Date());
	} else {
		console.warn("Trying to fetch missed messages with no last connection update time!");
	}
}

export function addConnectionListener(listener: ConnectionListener) {
	connectionListenerArray.push(listener);
}

export function removeConnectionListener(listener: ConnectionListener) {
	const index = connectionListenerArray.indexOf(listener, 0);
	if(index > -1) connectionListenerArray.splice(index, 1);
}

export function getActiveCommVer(): string | undefined {
	return communicationsManager?.communicationsVersion;
}

function pushKeyedArray<K, R>(map: Map<K, R[]>, key: K, value: R): void {
	//Finding the array in the map
	const array = map.get(key);
	
	//Pushing the value directly to the array if it exists
	if(array) array.push(value);
	//Otherwise, create a new array with the value
	else map.set(key, [value]);
}

function rejectAndClear(items: PromiseExecutor<any>[], reason?: any): void;
function rejectAndClear(items: Map<any, PromiseExecutor<any>[]>, reason?: any): void;
function rejectAndClear(items: PromiseExecutor<any>[] | Map<any, PromiseExecutor<any>[]>, reason?: any): void {
	if(items instanceof Array) {
		for(const promise of items) promise.reject(reason);
		items.length = 0;
	} else if(items instanceof Map) {
		for(const promiseArray of items.values()) {
			for(const promise of promiseArray) {
				promise.reject(reason);
			}
		}
		items.clear();
	}
}