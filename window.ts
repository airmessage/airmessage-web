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

declare global {
	interface Window {
		chrome: {
			webview: {
				hostObjects: {
					people: {
						GetContacts: () => Promise<PersonData[]>;
						FindContact: (query: string) => Promise<PersonData[] | undefined>;
					}
					connection: {
						Connect: (data: {hostname: string, port: number}) => Promise<void>;
						Send: (data: string) => Promise<void>;
						Disconnect: () => Promise<void>;
					}
					
					/* sync: {
						people: {
							getContacts: () => PersonData[];
							findContact: (query: string) => PersonData[] | undefined;
						}
					} */
				}
				
				addEventListener: (event: "message", callback: (
					data:
						{type: "connect" | "disconnect"} |
						{type: "message", data: {data: string, isEncrypted: boolean}}
				) => void) => void;
				removeEventListener: (event: "message", callback: VoidFunction) => void;
			}
		}
	}
}
