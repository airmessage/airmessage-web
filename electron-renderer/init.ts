import {setPeopleUtils} from "shared/util/peopleUtils";
import WindowsPeopleUtils from "./private/windowsPeopleUtils";

if(process.platform === "win32") {
	if(WPEnv.WINRT) {
		//Setting people
		setPeopleUtils(new WindowsPeopleUtils());
		console.log("Initialized WinRT integration");
	} else {
		console.warn("WinRT integration unavailable");
	}
}