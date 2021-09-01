import {PeopleUtils} from "shared/util/peopleUtils";
import {PersonData} from "../../../window";
import {windowsGetPeople, windowsFindPerson} from "./interopUtils";

export default class WindowsPeopleUtils extends PeopleUtils {
	initialize(): void {
	}
	
	getPeople(): Promise<PersonData[]> {
		return windowsGetPeople();
	}
	
	findPerson(address: string): Promise<PersonData> {
		return windowsFindPerson(address);
	}
}