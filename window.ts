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
					
					sync: {
						people: {
							getContacts: () => PersonData[];
							findContact: (query: string) => PersonData[] | undefined;
						}
					}
				}
			}
		}
	}
}