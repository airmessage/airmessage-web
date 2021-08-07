import {ContactData, PersonData} from "../../../window";
import {Deferred} from "shared/util/deferred";

/**
 * A wrapper function to post a message to native
 * that accepts an object with compile time type safety
 */
function postMessage(message:
	{type: "getContacts"} |
	{type: "findContact", address: string} |
	{type: "connect", hostname: string, port: number} |
	{type: "send", data: string} |
	{type: "disconnect"}
) {
	window.chrome.webview.postMessage(message);
}

let eventListenerInitialized = false;
let getContactsTask: Deferred<PersonData[]> | undefined = undefined;
const findContactTaskMap = new Map<string, Deferred<ContactData>>();

/**
 * Initializes the event listener for incoming messages from native
 */
export function initEventListener() {
	if(eventListenerInitialized) return;
	
	window.chrome.webview.addEventListener("message", (event) => {
		const message = event.data;
		
		switch(message.type) {
			case "getContacts":
				getContactsTask?.resolve(message.contacts);
				break;
			case "findContact":
				if(message.contact === undefined) {
					findContactTaskMap.get(message.address)?.reject(`Contact ${message.address} not found`);
				} else {
					findContactTaskMap.get(message.address)?.resolve(message.contact);
				}
				break;
		}
	});
	
	eventListenerInitialized = true;
}

/**
 * Gets an array of all contacts on the user's device
 */
export function getContacts(): Promise<PersonData[]> {
	initEventListener();
	
	if(getContactsTask !== undefined) return getContactsTask.promise;
	
	getContactsTask = new Deferred<PersonData[]>();
	postMessage({type: "getContacts"});
	return getContactsTask.promise;
}

/**
 * Finds a specific contact that matches an address, or throws an error if not found
 * @param address The email address or phone number of a contact to search for
 */
export function findContact(address: string): Promise<ContactData> {
	initEventListener();
	
	const existingTask = findContactTaskMap.get("address");
	if(existingTask !== undefined) return existingTask.promise;
	
	const task = new Deferred<ContactData>();
	findContactTaskMap.set(address, task);
	postMessage({type: "findContact", address: address});
	return task.promise;
}

/**
 * Connects to the server
 * @param hostname The hostname to connect to
 * @param port The port number to connect to
 */
export function serverConnect(hostname: string, port: number) {
	postMessage({type: "connect", hostname: hostname, port: port});
}

/**
 * Sends a message to the server
 * @param data The base64-encoded message content to send
 */
export function serverSend(data: string) {
	postMessage({type: "send", data: data});
}

/**
 * Disconnects from the server
 */
export function serverDisconnect() {
	postMessage({type: "disconnect"});
}