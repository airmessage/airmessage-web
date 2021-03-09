import {AddressData, AddressType, ContactData, PeopleUtils, PersonData} from "shared/util/peopleUtils";
import {formatAddress} from "shared/util/conversationUtils";

export default class WindowsPeopleUtils extends PeopleUtils {
	initialize(): void {
	}
	
	getPeople(): Promise<PersonData[]> {
		return Promise.resolve([]);
	}
	
	findPerson(address: string): Promise<ContactData> {
		return Promise.resolve(undefined);
	}
}