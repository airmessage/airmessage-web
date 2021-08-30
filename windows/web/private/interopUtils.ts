import {ChromeMessage, PersonData} from "../../../window";
import {Deferred} from "shared/util/deferred";
import EventEmitter from "shared/util/eventEmitter";

/**
 * A wrapper function to post a message to native
 * that accepts an object with compile time type safety
 */
function postMessage(message: ChromeMessage) {
	window.chrome.webview.postMessage(message);
}

let hasFocusTask: Deferred<boolean> | undefined = undefined;
let getSystemVersionTask: Deferred<string> | undefined = undefined;
let getContactsTask: Deferred<PersonData[]> | undefined = undefined;
const findContactTaskMap = new Map<string, Deferred<PersonData>>();

export const activateChatEventEmitter = new EventEmitter<string>();

/**
 * Initializes the native-JS bridge
 */
export function initializeInterop() {
	//Add event listener
	window.chrome.webview.addEventListener("message", (event) => {
		const message = event.data;
		
		switch(message.type) {
			case "activateChat":
				activateChatEventEmitter.notify(message.chatID);
				break;
			case "hasFocus":
				hasFocusTask?.resolve(message.hasFocus);
				hasFocusTask = undefined;
				break;
			case "getSystemVersion":
				getSystemVersionTask?.resolve(message.systemVersion);
				//Don't set to undefined, cache result since system version shouldn't change
				break;
			case "getPeople":
				getContactsTask?.resolve(message.people);
				getContactsTask = undefined;
				break;
			case "findPerson":
				if(message.person === undefined) {
					findContactTaskMap.get(message.address)?.reject(`Contact ${message.address} not found`);
				} else {
					findContactTaskMap.get(message.address)?.resolve(message.person);
				}
				findContactTaskMap.delete(message.address);
				break;
		}
	});
}

/**
 * Registers for Windows-WebView2 activations
 */
export function windowsRegisterActivations() {
	//Register for activations
	postMessage({type: "registerActivations"});
}

/**
 * Gets if the window is currently focused
 */
export function windowsHasFocus(): Promise<boolean> {
	if(hasFocusTask !== undefined) return hasFocusTask.promise;
	
	hasFocusTask = new Deferred<boolean>();
	postMessage({type: "hasFocus"});
	return hasFocusTask.promise;
}

/**
 * Gets a string that represents the current system version
 */
export function windowsGetSystemVersion(): Promise<string> {
	if(getSystemVersionTask !== undefined) return getSystemVersionTask.promise;
	
	getSystemVersionTask = new Deferred<string>();
	postMessage({type: "getSystemVersion"});
	return getSystemVersionTask.promise;
}

/**
 * Gets an array of all contacts on the user's device
 */
export function windowsGetPeople(): Promise<PersonData[]> {
	if(getContactsTask !== undefined) return getContactsTask.promise;
	
	getContactsTask = new Deferred<PersonData[]>();
	postMessage({type: "getPeople"});
	return getContactsTask.promise;
}

/**
 * Finds a specific contact that matches an address, or throws an error if not found
 * @param address The email address or phone number of a contact to search for
 */
export function windowsFindPerson(address: string): Promise<PersonData> {
	const existingTask = findContactTaskMap.get(address);
	if(existingTask !== undefined) return existingTask.promise;
	
	const task = new Deferred<PersonData>();
	findContactTaskMap.set(address, task);
	postMessage({type: "findPerson", address: address});
	return task.promise;
}

/**
 * Shows a notification
 * @param chatID The ID of the chat
 * @param personID The ID of the person who sent the message (optional)
 * @param messageID The ID of the message
 * @param chatName The display name of the chat
 * @param contactName The display name or address of the contact who sent the message
 * @param message The message content
 */
export function windowsShowNotification(chatID: string, personID: string | undefined, messageID: string, chatName: string, contactName: string, message: string) {
	postMessage({type: "showNotification", chatID, personID, messageID, chatName, contactName, message});
}

/**
 * Dismisses all notifications from the specified chat
 * @param chatID The ID of the chat to dismiss notifications for
 */
export function windowsDismissNotifications(chatID: string) {
	postMessage({type: "dismissNotifications", chatID});
}

/**
 * Connects to the server
 * @param hostname The hostname to connect to
 * @param port The port number to connect to
 */
export function windowsServerConnect(hostname: string, port: number) {
	postMessage({type: "connect", hostname: hostname, port: port});
}

/**
 * Sends a message to the server
 * @param data The base64-encoded message content to send
 */
export function windowsServerSend(data: string) {
	postMessage({type: "send", data: data});
}

/**
 * Disconnects from the server
 */
export function windowsServerDisconnect() {
	postMessage({type: "disconnect"});
}