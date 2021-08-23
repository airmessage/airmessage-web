export enum AddressType {
	Email = "email",
	Phone = "phone"
}

export interface AddressData {
	value: string;
	displayValue: string;
	label?: string;
	type: AddressType;
}

export interface PersonData {
	id: string;
	name?: string;
	avatar?: string;
	addresses: AddressData[];
}

export type ChromeMessage =
	//Platform
	{type: "registerActivations"} |
	{type: "hasFocus"} |
	//Contacts
	{type: "getPeople"} |
	{type: "findPerson", address: string} |
	//Notifications
	{type: "showNotification", chatID: string, personID: string | undefined, messageID: string, chatName: string, contactName: string, message: string} |
	{type: "dismissNotifications", chatID: string} |
	//Connection
	{type: "connect", hostname: string, port: number} |
	{type: "send", data: string} |
	{type: "disconnect"};

export type ChromeEventData =
	//Activations
	{type: "activateChat", chatID: string} |
	//Platform
	{type: "hasFocus", hasFocus: boolean} |
	//Contacts
	{type: "getPeople", people: PersonData[]} |
	{type: "findPerson", address: string, person: PersonData | undefined} |
	//Connection
	{type: "connect" | "disconnect"} |
	{type: "message", data: string, isEncrypted: boolean};
export type ChromeEvent = {data: ChromeEventData} & Event;
export type ChromeEventListener = (event: ChromeEvent) => void;

declare global {
	interface Window {
		chrome: {
			webview: {
				postMessage: (message: ChromeMessage) => void;
				addEventListener: (event: "message", callback: ChromeEventListener) => void;
				removeEventListener: (event: "message", callback: ChromeEventListener) => void;
			}
		}
	}
}
