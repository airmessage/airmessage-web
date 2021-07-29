import { PeopleUtils} from "shared/util/peopleUtils";
import {ContactData, PersonData} from "../../../window";

export default class WindowsPeopleUtils extends PeopleUtils {
	initialize(): void {
	}
	
	getPeople(): Promise<PersonData[]> {
		return window.chrome.webview.hostObjects.people.getContacts();
	}
	
	findPerson(address: string): Promise<ContactData> {
		return window.chrome.webview.hostObjects.people.findContact(address)
			.then((contact) => {
				if(contact === undefined) {
					throw new Error(`Contact ${address} not found`);
				} else {
					return contact as ContactData;
				}
			});
	}
}