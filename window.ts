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
						getContacts: () => Promise<PersonData[]>;
						findContact: (query: string) => Promise<PersonData[] | undefined>;
					}
					connection: {
						connect: (address: string) => Promise<void>;
						send: (data: string) => Promise<void>;
						disconnect: () => Promise<void>;
					}
					
					/* sync: {
						people: {
							getContacts: () => PersonData[];
							findContact: (query: string) => PersonData[] | undefined;
						}
					} */
				}
				
				//addEventListener: (event: string, callback: (result: Record<string, unknown>) => void) => void;
				addEventListener:
					((event: "connect", callback: () => void) => void) |
					((event: "close", callback: () => void) => void) |
					((event: "message", callback: (data: {size: number, isEncrypted: boolean}) => void) => void)
				removeEventListener: (event: string, callback: VoidFunction) => void;
			}
		}
	}
}
