import {setPeopleUtils} from "shared/util/peopleUtils";
import WindowsPeopleUtils from "./private/windowsPeopleUtils";

//Setting people
if(process.platform === "win32" && require.resolve("airmessage-winrt")) {
	setPeopleUtils(new WindowsPeopleUtils());
}