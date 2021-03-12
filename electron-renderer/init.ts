import {setPeopleUtils} from "shared/util/peopleUtils";
import WindowsPeopleUtils from "./private/windowsPeopleUtils";

//Setting people
if(process.platform === "win32") {
	setPeopleUtils(new WindowsPeopleUtils());
}