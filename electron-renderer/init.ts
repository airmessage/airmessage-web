import {setPeopleUtils} from "shared/util/peopleUtils";
import WindowsPeopleUtils from "./private/windowsPeopleUtils";

let nativeWindowsAvailable = false;
try {
	nativeWindowsAvailable = process.platform === "win32" && !!require.resolve("airmessage-winrt");
} catch(e) {
	console.log(e);
}

//Setting people
if(nativeWindowsAvailable) {
	setPeopleUtils(new WindowsPeopleUtils());
}