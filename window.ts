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

export interface ContactData {
	name?: string;
	avatar?: string;
}

export type ChromeEventData =
	//Contacts
	{type: "getContacts", contacts: PersonData[]} |
	{type: "findContact", address: string, contact: ContactData | undefined} |
	//Connection
	{type: "connect" | "disconnect"} |
	{type: "message", data: string, isEncrypted: boolean};
export type ChromeEvent = {data: ChromeEventData} & Event;
export type ChromeEventListener = (event: ChromeEvent) => void;

declare global {
	interface Window {
		chrome: {
			webview: {
				postMessage: (message: any) => void;
				addEventListener: (event: "message", callback: ChromeEventListener) => void;
				removeEventListener: (event: "message", callback: ChromeEventListener) => void;
			}
		}
	}
}
