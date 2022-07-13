import DataProxyConnect from "shared/connection/connect/dataProxyConnect";
import CommunicationsManager, {
  CommunicationsManagerListener,
} from "./communicationsManager";
import ClientComm5 from "./comm5/clientComm5";
import DataProxy from "./dataProxy";
import {
  Conversation,
  ConversationItem,
  LinkedConversation,
  MessageModifier,
} from "../data/blocks";
import {
  AttachmentRequestErrorCode,
  ConnectionErrorCode,
  CreateChatErrorCode,
  FaceTimeInitiateCode,
  FaceTimeLinkErrorCode,
  MessageError,
  MessageErrorCode,
  RemoteUpdateErrorCode,
} from "../data/stateCodes";
import EventEmitter, { CachedEventEmitter } from "../util/eventEmitter";
import promiseTimeout from "../util/promiseTimeout";
import { TransferAccumulator } from "./transferAccumulator";
import {
  isCryptoPasswordSet,
  setCryptoPassword,
} from "shared/util/encryptionUtils";
import { getSecureLS, SecureStorageKey } from "shared/util/secureStorageUtils";
import FileDownloadResult from "shared/data/fileDownloadResult";
import ServerUpdateData from "shared/data/serverUpdateData";
import ResolveablePromiseTimeout from "shared/util/resolveablePromiseTimeout";
import CallEvent from "shared/data/callEvent";
import ConversationTarget from "shared/data/conversationTarget";
import EmitterPromiseTuple from "shared/util/emitterPromiseTuple";

export const warnCommVer: number[] = [5, 4]; //Warn users on a communications version older than this to update
export const targetCommVer: number[] = [5, 5];
export const targetCommVerString = targetCommVer.join(".");

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
let _serverComputerName: string | undefined;
export function getServerComputerName(): string | undefined {
  return _serverComputerName;
}

//Communications manager constructor shape
interface CreatesCommunicationsManager {
  new (dataProxy: DataProxy): CommunicationsManager;
}

//Connection values
const communicationsPriorityList: ReadonlyArray<CreatesCommunicationsManager> =
  [ClientComm5];
let reconnectTimeoutID: any | undefined;

let communicationsManager: CommunicationsManager | null = null;
let dataProxy: DataProxy = new DataProxyConnect();
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

export interface RemoteUpdateListener {
  onUpdate?: (update: ServerUpdateData | undefined) => void;
  onInitiate?: () => void;
  onError?: (code: RemoteUpdateErrorCode, details?: string) => void;
}
const remoteUpdateListenerArray: RemoteUpdateListener[] = [];

//Promise response values
interface PromiseExecutor<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

const liteConversationPromiseArray: PromiseExecutor<LinkedConversation[]>[] =
  []; //Retrieval of all lite conversations
interface ThreadKey {
  chatGUID: string;
  firstMessageID?: number;
}
const conversationDetailsPromiseMap: Map<
  string,
  PromiseExecutor<[string, Conversation | undefined][]>[]
> = new Map(); //Retrieval of a specific conversation's details
const threadPromiseMap: Map<string, PromiseExecutor<ConversationItem[]>[]> =
  new Map(); //Retrieval of messages from a thread
let faceTimeLinkPromise: ResolveablePromiseTimeout<string> | undefined =
  undefined; //Creating a FaceTime link
let faceTimeInitiatePromise: ResolveablePromiseTimeout<void> | undefined =
  undefined; //Initiating a FaceTime call

class FileDownloadState {
  private accumulator!: TransferAccumulator;
  public get accumulatedData() {
    return this.accumulator.data;
  }
  public get accumulatedDataLength() {
    return this.accumulator.length;
  }
  readonly promise: PromiseExecutor<FileDownloadResult>;
  readonly progressEmitter: EventEmitter<FileDownloadProgress>;
  private readonly timeoutCallback: () => void;

  private timeoutID: number | undefined;

  public downloadFileName: string | undefined = undefined;
  public downloadFileType: string | undefined = undefined;

  constructor(
    promise: PromiseExecutor<FileDownloadResult>,
    progressEmitter: EventEmitter<FileDownloadProgress>,
    timeoutCallback: () => void
  ) {
    this.promise = promise;
    this.progressEmitter = progressEmitter;
    this.timeoutCallback = timeoutCallback;
  }

  public initializeAccumulator(accumulator: TransferAccumulator) {
    //Setting the accumulator
    this.accumulator = accumulator;

    this.refreshTimeout();
  }

  public appendData(data: ArrayBuffer) {
    //Adding the data to the array
    this.accumulator.push(data);

    this.refreshTimeout();
  }

  public finish() {
    if (this.timeoutID !== undefined) clearTimeout(this.timeoutID);
  }

  private refreshTimeout() {
    if (this.timeoutID !== undefined) clearTimeout(this.timeoutID);
    this.timeoutID = window.setTimeout(
      this.timeoutCallback,
      requestTimeoutMillis
    );
  }
}

interface FileDownloadProgress {
  type: "size" | "downloaded";
  value: number;
}
const fileDownloadStateMap: Map<number, FileDownloadState> = new Map(); //Attachment data retrieval
const messageSendPromiseMap: Map<number, PromiseExecutor<any>> = new Map(); //Response from sending a message
const chatCreatePromiseMap: Map<number, PromiseExecutor<string>> = new Map(); //Response from creating a chat

export const messageUpdateEmitter = new EventEmitter<ConversationItem[]>(); //Message updates
export const modifierUpdateEmitter = new EventEmitter<MessageModifier[]>(); //Modifier updates
export const faceTimeSupportedEmitter = new CachedEventEmitter<boolean>(false); //Whether the connected server supports FaceTime
export const incomingCallerEmitter = new CachedEventEmitter<
  string | undefined
>(); //The current incoming caller
export const outgoingCalleeEmitter = new CachedEventEmitter<
  string[] | undefined
>(); //The current outgoing callee
export const callEventEmitter = new EventEmitter<CallEvent>(); //Standard call events

//Common promise responses
const messageErrorNetwork: MessageError = {
  code: MessageErrorCode.LocalNetwork,
};

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
  onOpen(
    computerName: string,
    systemVersion: string,
    softwareVersion: string,
    supportsFaceTime: boolean
  ): void {
    //Updating the state
    updateStateConnected();

    //Recording the server information
    _serverComputerName = computerName;
    _serverSystemVersion = systemVersion;
    _serverSoftwareVersion = softwareVersion;
    faceTimeSupportedEmitter.notify(supportsFaceTime);

    //Listening for network events
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
  },
  onClose(reason: ConnectionErrorCode): void {
    //Failing all pending promises
    rejectAndClear(liteConversationPromiseArray, messageErrorNetwork);
    rejectAndClear(conversationDetailsPromiseMap, messageErrorNetwork);
    rejectAndClear(threadPromiseMap, messageErrorNetwork);

    for (const state of fileDownloadStateMap.values())
      state.promise.reject(AttachmentRequestErrorCode.Timeout);
    fileDownloadStateMap.clear();
    for (const promise of messageSendPromiseMap.values())
      promise.reject(messageErrorNetwork);
    messageSendPromiseMap.clear();
    for (const promise of chatCreatePromiseMap.values())
      promise.reject([CreateChatErrorCode.Network, undefined]);
    chatCreatePromiseMap.clear();

    faceTimeLinkPromise?.reject(FaceTimeLinkErrorCode.Network);
    faceTimeLinkPromise = undefined;
    faceTimeInitiatePromise?.reject(FaceTimeInitiateCode.Network);
    faceTimeInitiatePromise = undefined;

    //Updating the state
    updateStateDisconnected(reason);
    incomingCallerEmitter.notify(undefined);
    outgoingCalleeEmitter.notify(undefined);
    for (const listener of remoteUpdateListenerArray)
      listener.onUpdate?.(undefined);

    //Checking if the error is automatically recoverable
    if (
      (reason === ConnectionErrorCode.Connection ||
        reason === ConnectionErrorCode.Internet) &&
      !disableAutomaticReconnections
    ) {
      //Scheduling a passive reconnection
      reconnectTimeoutID = setTimeout(() => {
        if (!disableAutomaticReconnections) {
          connectPassive();
        }
      }, reconnectInterval);
    }

    //Removing the network event listeners
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  },
  onPacket(): void {
    if (connState === "connected") {
      //Recording the last connection update time
      lastConnectionUpdateTime = new Date();
    }
  },
  onMessageUpdate(data: ConversationItem[]): void {
    //Notifying the listeners
    messageUpdateEmitter.notify(data);
  },
  onConversationUpdate(data: [string, Conversation | undefined][]): void {
    //Resolving pending promises
    const promiseMapKey = data.map((data) => data[0]).join(" ");
    const promiseArray = conversationDetailsPromiseMap.get(promiseMapKey);
    if (promiseArray) {
      for (const promise of promiseArray) promise.resolve(data);
      threadPromiseMap.delete(promiseMapKey);
    }
  },
  onModifierUpdate(data: MessageModifier[]): void {
    //Notifying the listeners
    modifierUpdateEmitter.notify(data);
  },
  onFileRequestStart(
    requestID,
    downloadFileName,
    downloadFileType,
    dataLength,
    accumulator
  ) {
    //Finding the local request
    const state = fileDownloadStateMap.get(requestID);
    if (!state) return;

    //Setting the download file information
    state.downloadFileName = downloadFileName;
    state.downloadFileType = downloadFileType;

    //Setting the accumulator
    state.initializeAccumulator(accumulator);

    //Updating the progress
    state.progressEmitter.notify({ type: "size", value: dataLength });
  },
  onFileRequestData(requestID: number, data: ArrayBuffer): void {
    //Finding the local request
    const state = fileDownloadStateMap.get(requestID);
    if (!state) return;

    //Adding the data
    state.appendData(data);

    //Updating the progress
    state.progressEmitter.notify({
      type: "downloaded",
      value: state.accumulatedDataLength,
    });
  },
  onFileRequestComplete(requestID: number): void {
    //Finding the local request
    const state = fileDownloadStateMap.get(requestID);
    if (!state) return;

    //Finishing the request
    state.finish();
    state.promise.resolve({
      data: state.accumulatedData,
      downloadName: state.downloadFileName,
      downloadType: state.downloadFileType,
    });

    //Removing the request
    fileDownloadStateMap.delete(requestID);
  },
  onFileRequestFail(
    requestID: number,
    error: AttachmentRequestErrorCode
  ): void {
    //Finding the local request
    const state = fileDownloadStateMap.get(requestID);
    if (!state) return;

    //Failing the request
    state.promise.reject(error);

    //Removing the request
    fileDownloadStateMap.delete(requestID);
  },
  onIDUpdate(messageID: number): void {
    //Recording the last message ID
    lastServerMessageID = messageID;
  },
  onMessageConversations(data: LinkedConversation[]): void {
    //Resolving pending promises
    for (const promise of liteConversationPromiseArray) promise.resolve(data);

    //Emptying the array
    liteConversationPromiseArray.length = 0;
  },
  onMessageThread(
    chatGUID: string,
    firstMessageID: number | undefined,
    data: ConversationItem[]
  ) {
    //Resolving pending promises
    const promiseMapKey = JSON.stringify({
      chatGUID: chatGUID,
      firstMessageID: firstMessageID,
    } as ThreadKey);
    const promiseArray = threadPromiseMap.get(promiseMapKey);
    if (promiseArray) {
      for (const promise of promiseArray) promise.resolve(data);
      threadPromiseMap.delete(promiseMapKey);
    }
  },
  onSendMessageResponse(
    requestID: number,
    error: MessageError | undefined
  ): void {
    //Resolving pending promises
    const promise = messageSendPromiseMap.get(requestID);
    if (!promise) return;

    if (error !== undefined) {
      promise.reject(error);
    } else {
      promise.resolve(true);
    }

    messageSendPromiseMap.delete(requestID);
  },
  onCreateChatResponse(
    requestID: number,
    error: CreateChatErrorCode | undefined,
    details: string | undefined
  ): void {
    //Resolving pending promises
    const promise = chatCreatePromiseMap.get(requestID);
    if (!promise) return;

    if (error === undefined) {
      if (details) {
        promise.resolve(details);
      } else {
        promise.reject([CreateChatErrorCode.Network, undefined]);
      }
    } else {
      promise.reject([error, details]);
    }

    chatCreatePromiseMap.delete(requestID);
  },
  onSoftwareUpdateListing(updateData: ServerUpdateData | undefined): void {
    for (const listener of remoteUpdateListenerArray)
      listener.onUpdate?.(updateData);
  },
  onSoftwareUpdateInstall(installing: boolean): void {
    if (installing) {
      for (const listener of remoteUpdateListenerArray) listener.onInitiate?.();
    } else {
      for (const listener of remoteUpdateListenerArray)
        listener.onError?.(RemoteUpdateErrorCode.Mismatch);
    }
  },
  onSoftwareUpdateError(
    error: RemoteUpdateErrorCode,
    details: string | undefined
  ): void {
    for (const listener of remoteUpdateListenerArray)
      listener.onError?.(error, details);
  },
  onFaceTimeNewLink(faceTimeLink: string | undefined): void {
    //Ignoring if there is no pending request
    if (faceTimeLinkPromise === undefined) return;

    //Resolving the completable
    if (faceTimeLink === undefined) {
      faceTimeLinkPromise.reject(FaceTimeLinkErrorCode.External);
    } else {
      faceTimeLinkPromise.resolve(faceTimeLink);
    }

    faceTimeLinkPromise = undefined;
  },
  onFaceTimeOutgoingCallInitiated(
    resultCode: FaceTimeInitiateCode,
    errorDetails: string | undefined
  ): void {
    //Ignoring if there is no pending request
    if (faceTimeInitiatePromise === undefined) return;

    //Resolving the completable
    if (resultCode === FaceTimeInitiateCode.OK) {
      faceTimeInitiatePromise.resolve();
    } else {
      faceTimeInitiatePromise.reject([resultCode, errorDetails]);
    }

    faceTimeInitiatePromise = undefined;
  },
  onFaceTimeOutgoingCallAccepted(faceTimeLink: string): void {
    callEventEmitter.notify({ type: "outgoingAccepted", faceTimeLink });
    outgoingCalleeEmitter.notify(undefined);
  },
  onFaceTimeOutgoingCallRejected(): void {
    callEventEmitter.notify({ type: "outgoingRejected" });
    outgoingCalleeEmitter.notify(undefined);
  },
  onFaceTimeOutgoingCallError(errorDetails: string | undefined): void {
    callEventEmitter.notify({ type: "outgoingError", errorDetails });
    outgoingCalleeEmitter.notify(undefined);
  },
  onFaceTimeIncomingCall(caller: string | undefined): void {
    incomingCallerEmitter.notify(caller);
  },
  onFaceTimeIncomingCallHandled(faceTimeLink: string): void {
    callEventEmitter.notify({ type: "incomingHandled", faceTimeLink });
  },
  onFaceTimeIncomingCallError(errorDetails: string | undefined): void {
    callEventEmitter.notify({ type: "incomingHandleError", errorDetails });
  },
};

function updateStateDisconnected(reason: ConnectionErrorCode) {
  connState = "disconnected";
  for (const listener of connectionListenerArray) listener.onClose(reason);
}

function updateStateConnecting() {
  connState = "connecting";
  for (const listener of connectionListenerArray) listener.onConnecting();
}

function updateStateConnected() {
  connState = "connected";
  for (const listener of connectionListenerArray) listener.onOpen();
}

function generateRequestID(): number {
  //Recording the next request ID
  const requestID = nextRequestID;

  //Increasing the request ID (and overflowing at Java's max short value)
  if (nextRequestID === 32767) nextRequestID = -32768;
  else nextRequestID++;

  //Returning the request ID
  return requestID;
}

export async function connect() {
  //Load the password if it hasn't been loaded yet
  if (!isCryptoPasswordSet()) {
    try {
      await setCryptoPassword(
        await getSecureLS(SecureStorageKey.ServerPassword)
      );
    } catch (error) {
      console.warn(error);
    }
  }

  //Checking if a passive reconnection is in progress
  if (isConnectingPassively) {
    //Bringing the state from passive to the foreground
    updateStateConnecting();
    isConnectingPassively = false;

    return;
  }

  //Cancelling the reconnect timeout if it's running
  if (reconnectTimeoutID) {
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

function requestTimeoutMap<T, K>(
  key: K,
  map: Map<K, any>,
  timeoutReason: any | undefined = messageErrorNetwork,
  promise: Promise<T>
): Promise<T> {
  const timedPromise = promiseTimeout(
    requestTimeoutMillis,
    timeoutReason,
    promise
  );
  timedPromise.catch(() => map.delete(key)); //Remove the promise from the map on error
  return timedPromise;
}

function requestTimeoutArray<T, K>(
  array: K[],
  timeoutReason: any | undefined = messageErrorNetwork,
  promise: Promise<T>
): Promise<T> {
  const timedPromise = promiseTimeout(
    requestTimeoutMillis,
    timeoutReason,
    promise
  );
  timedPromise.catch(() => (array.length = 0)); //Clear the array on error
  return timedPromise;
}

export function sendMessage(
  target: ConversationTarget,
  message: string
): Promise<any> {
  //Failing immediately if there is no network connection
  if (!isConnected()) return Promise.reject(messageErrorNetwork);

  //Starting a new promise
  const requestID = generateRequestID();
  return requestTimeoutMap(
    requestID,
    messageSendPromiseMap,
    undefined,
    new Promise<any>((resolve, reject) => {
      //Sending the request
      communicationsManager!.sendMessage(requestID, target, message);

      //Recording the promise
      messageSendPromiseMap.set(requestID, {
        resolve: resolve,
        reject: reject,
      });
    })
  );
}

export function sendFile(
  chatGUID: ConversationTarget,
  file: File
): EmitterPromiseTuple<string | number, void> {
  const emitter = new EventEmitter<string | number>();

  //Fail immediately if there is no network connection
  if (!isConnected()) {
    return {
      emitter,
      promise: Promise.reject(messageErrorNetwork),
    };
  }

  //Starting a new promise
  const promise = new Promise<void>((resolve, reject) => {
    const requestID = generateRequestID();

    //Sending the request
    communicationsManager!
      .sendFile(requestID, chatGUID, file, (progress) =>
        emitter.notify(progress)
      )
      .then((value) => {
        //Forwarding the value to the promise
        emitter.notify(value);

        //Starting a timeout for the server response
        const timeoutError: MessageError = {
          code: MessageErrorCode.LocalNetwork,
        };
        setTimeout(() => reject(timeoutError), requestTimeoutMillis);
      })
      .catch((error) => {
        //Forwarding the value to the promise
        reject(error);

        //Removing this promise from the map
        messageSendPromiseMap.delete(requestID);
      });

    //Recording the promise
    messageSendPromiseMap.set(requestID, { resolve: resolve, reject: reject });
  });

  return { emitter, promise };
}

export function fetchConversations(): Promise<LinkedConversation[]> {
  //Failing immediately if there is no network connection
  if (!isConnected()) return Promise.reject(messageErrorNetwork);

  //Starting a new promise
  return requestTimeoutArray(
    liteConversationPromiseArray,
    undefined,
    new Promise<LinkedConversation[]>((resolve, reject) => {
      //Sending the request
      communicationsManager!.requestLiteConversations();

      //Recording the promise
      liteConversationPromiseArray.push({ resolve: resolve, reject: reject });
    })
  );
}

export function fetchConversationInfo(
  chatGUIDs: string[]
): Promise<[string, LinkedConversation | undefined][]> {
  //Failing immediately if there is no network connection
  if (!isConnected()) return Promise.reject(messageErrorNetwork);

  //Starting a new promise
  const key = chatGUIDs.join(" ");
  return requestTimeoutMap(
    key,
    conversationDetailsPromiseMap,
    undefined,
    new Promise<[string, LinkedConversation | undefined][]>(
      (resolve, reject) => {
        //Sending the request
        communicationsManager!.requestConversationInfo(chatGUIDs);

        //Recording the promise
        pushKeyedArray(conversationDetailsPromiseMap, key, {
          resolve: resolve,
          reject: reject,
        });
      }
    )
  );
}

export function fetchThread(
  chatGUID: string,
  firstMessageID?: number
): Promise<ConversationItem[]> {
  //Failing immediately if there is no network connection
  if (!isConnected()) return Promise.reject(messageErrorNetwork);

  //Starting a new promise
  const key = JSON.stringify({
    chatGUID: chatGUID,
    firstMessageID: firstMessageID,
  } as ThreadKey);
  return requestTimeoutMap(
    key,
    threadPromiseMap,
    undefined,
    new Promise<ConversationItem[]>((resolve, reject) => {
      //Sending the request
      communicationsManager!.requestLiteThread(chatGUID, firstMessageID);

      //Recording the promise
      pushKeyedArray(threadPromiseMap, key, {
        resolve: resolve,
        reject: reject,
      });
    })
  );
}

export function fetchAttachment(
  attachmentGUID: string
): EmitterPromiseTuple<FileDownloadProgress, FileDownloadResult> {
  const emitter = new EventEmitter<FileDownloadProgress>();

  //Failing immediately if there is no network connection
  if (!isConnected()) {
    return {
      emitter,
      promise: Promise.reject(AttachmentRequestErrorCode.Timeout),
    };
  }

  //Starting a new promise
  const promise = new Promise<FileDownloadResult>((resolve, reject) => {
    const requestID = generateRequestID();

    //Sending the request
    communicationsManager!.requestAttachmentDownload(requestID, attachmentGUID);

    //Recording the promise
    fileDownloadStateMap.set(
      requestID,
      new FileDownloadState(
        { resolve: resolve, reject: reject },
        emitter,
        () => {
          //Removing and rejecting the promise
          fileDownloadStateMap.delete(requestID);
          reject();
        }
      )
    );
  });

  return { emitter, promise };
}

export function createChat(
  members: string[],
  service: string
): Promise<string> {
  //Failing immediately if there is no network connection
  if (!isConnected())
    return Promise.reject([CreateChatErrorCode.Network, undefined]);

  //Starting a new promise
  const requestID = generateRequestID();
  return requestTimeoutMap(
    requestID,
    chatCreatePromiseMap,
    [CreateChatErrorCode.Network, undefined],
    new Promise<string>((resolve, reject) => {
      //Sending the request
      communicationsManager!.requestChatCreation(requestID, members, service);

      //Recording the promise
      chatCreatePromiseMap.set(requestID, { resolve: resolve, reject: reject });
    })
  );
}

export function requestMissedMessages() {
  if (
    lastServerMessageID !== undefined &&
    lastConnectionUpdateTime !== undefined
  ) {
    communicationsManager!.requestRetrievalID(
      lastServerMessageID,
      lastConnectionUpdateTime,
      new Date()
    );
  } else if (lastConnectionUpdateTime !== undefined) {
    communicationsManager!.requestRetrievalTime(
      lastConnectionUpdateTime,
      new Date()
    );
  } else {
    console.warn(
      "Trying to fetch missed messages with no last connection update time!"
    );
  }
}

export function installRemoteUpdate(updateID: number): void {
  //Failing immediately if there is no network connection
  if (!isConnected()) return;

  //Sending the request
  communicationsManager!.requestInstallRemoteUpdate(updateID);
}

/**
 * Requests a FaceTime link from the server
 * @return A promise that resolves with the fetched FaceTime link
 */
export function requestFaceTimeLink(): Promise<string> {
  //If there is already an active request, return it
  if (faceTimeLinkPromise !== undefined) {
    return faceTimeLinkPromise.promise;
  }

  //Failing immediately if there is no network connection
  if (!isConnected()) {
    return Promise.reject(FaceTimeLinkErrorCode.Network);
  }

  //Creating the promise
  faceTimeLinkPromise = new ResolveablePromiseTimeout();

  //Setting a timeout
  faceTimeLinkPromise.timeout(
    requestTimeoutMillis,
    FaceTimeLinkErrorCode.Network
  );

  //Starting the request
  communicationsManager!.requestFaceTimeLink();

  //Returning the promise
  return faceTimeLinkPromise.promise;
}

/**
 * Initiates a new outgoing FaceTime call with the specified addresses
 * @param addresses The list of addresses to initiate the call with
 * @return A promise that resolves when the call is initiated
 */
export function initiateFaceTimeCall(addresses: string[]): Promise<void> {
  //If there is already an active request, return it
  if (faceTimeInitiatePromise !== undefined) {
    return faceTimeInitiatePromise.promise;
  }

  //Failing immediately if there is no network connection
  if (!isConnected()) {
    return Promise.reject([FaceTimeInitiateCode.Network, undefined]);
  }

  //Creating the promise
  faceTimeInitiatePromise = new ResolveablePromiseTimeout();

  //Setting a timeout
  faceTimeInitiatePromise.timeout(requestTimeoutMillis, [
    FaceTimeInitiateCode.Network,
    undefined,
  ]);

  //Starting the request
  communicationsManager!.initiateFaceTimeCall(addresses);

  //Emitting an update
  outgoingCalleeEmitter.notify(addresses);
  faceTimeInitiatePromise.promise.catch(() => {
    outgoingCalleeEmitter.notify(undefined);
  });

  //Returning the promise
  return faceTimeInitiatePromise.promise;
}

/**
 * Accepts or rejects a pending incoming FaceTime call
 * @param caller The name of the caller to accept or reject the call of
 * @param accept True to accept the call, or false to reject
 * @return Whether the request was successfully sent
 */
export function handleIncomingFaceTimeCall(
  caller: string,
  accept: boolean
): void {
  //Failing immediately if there is no network connection
  if (!isConnected()) return;

  //Sending the request
  communicationsManager!.handleIncomingFaceTimeCall(caller, accept);
}

/**
 * Tells the server to leave the current FaceTime call
 */
export function dropFaceTimeCallServer(): void {
  //Failing immediately if there is no network connection
  if (!isConnected()) return;

  //Sending the request
  communicationsManager!.dropFaceTimeCallServer();
}

export function addConnectionListener(listener: ConnectionListener) {
  connectionListenerArray.push(listener);
}

export function removeConnectionListener(listener: ConnectionListener) {
  const index = connectionListenerArray.indexOf(listener, 0);
  if (index > -1) connectionListenerArray.splice(index, 1);
}

export function addRemoteUpdateListener(listener: RemoteUpdateListener) {
  remoteUpdateListenerArray.push(listener);
}

export function removeRemoteUpdateListener(listener: RemoteUpdateListener) {
  const index = remoteUpdateListenerArray.indexOf(listener, 0);
  if (index > -1) remoteUpdateListenerArray.splice(index, 1);
}

export function getActiveCommVer(): number[] | undefined {
  return communicationsManager?.communicationsVersion;
}

export function getActiveProxyType(): string {
  return dataProxy.proxyType;
}

function pushKeyedArray<K, R>(map: Map<K, R[]>, key: K, value: R): void {
  //Finding the array in the map
  const array = map.get(key);

  //Pushing the value directly to the array if it exists
  if (array) array.push(value);
  //Otherwise, create a new array with the value
  else map.set(key, [value]);
}

function rejectAndClear(items: PromiseExecutor<any>[], reason?: any): void;
function rejectAndClear(
  items: Map<any, PromiseExecutor<any>[]>,
  reason?: any
): void;
function rejectAndClear(
  items: PromiseExecutor<any>[] | Map<any, PromiseExecutor<any>[]>,
  reason?: any
): void {
  if (items instanceof Array) {
    for (const promise of items) promise.reject(reason);
    items.length = 0;
  } else if (items instanceof Map) {
    for (const promiseArray of items.values()) {
      for (const promise of promiseArray) {
        promise.reject(reason);
      }
    }
    items.clear();
  }
}
