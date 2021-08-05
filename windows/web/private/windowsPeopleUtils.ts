import { PeopleUtils} from "shared/util/peopleUtils";
import {ContactData, PersonData} from "../../../window";

export default class WindowsPeopleUtils extends PeopleUtils {
	initialize(): void {
	}
	
	getPeople(): Promise<PersonData[]> {
		return window.chrome.webview.hostObjects.people.GetContacts();
	}
	
	findPerson(address: string): Promise<ContactData> {
		return window.chrome.webview.hostObjects.people.FindContact(address)
			.then((contact) => {
				if(contact === undefined) {
					throw new Error(`Contact ${address} not found`);
				} else {
					return contact as ContactData;
				}
			});
	}
}