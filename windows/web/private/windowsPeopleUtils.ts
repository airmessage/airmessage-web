import { PeopleUtils} from "shared/util/peopleUtils";
import {ContactData, PersonData} from "../../../window";
import {findContact, getContacts} from "./interopUtils";

export default class WindowsPeopleUtils extends PeopleUtils {
	initialize(): void {
	}
	
	getPeople(): Promise<PersonData[]> {
		return getContacts();
	}
	
	findPerson(address: string): Promise<ContactData> {
		return findContact(address);
	}
}