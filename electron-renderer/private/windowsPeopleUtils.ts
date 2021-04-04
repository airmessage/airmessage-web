import {ContactData, PeopleUtils, PersonData} from "shared/util/peopleUtils";
import {findContact, getContacts} from "airmessage-winrt";

export default class WindowsPeopleUtils extends PeopleUtils {
	initialize(): void {
	}
	
	getPeople(): Promise<PersonData[]> {
		return new Promise<PersonData[]>((resolve) => getContacts((contacts) => resolve(contacts as PersonData[])));
	}
	
	findPerson(address: string): Promise<ContactData> {
		return new Promise<ContactData>((resolve, reject) => {
			findContact(address, (contact) => {
				if(contact) resolve(contact as ContactData);
				else reject(new Error(`Contact ${address} not found`));
			});
		});
	}
}