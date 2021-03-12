interface Contact {
	name?: string;
	addresses: Address[];
}

interface Address {
	value: string;
	displayValue: string;
	type: "email" | "phone";
}

export function getContacts(callback: (contacts: Contact[]) => void): void;
export function findContact(query: string, callback: (contact: Contact | undefined) => void): Contact[];