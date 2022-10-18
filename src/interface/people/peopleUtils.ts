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

export class PeopleNoPermissionError extends Error {
	
}
