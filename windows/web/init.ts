import {setPeopleUtils} from "shared/util/peopleUtils";
import WindowsPeopleUtils from "./private/windowsPeopleUtils";
import {setNotificationUtils} from "shared/util/notificationUtils";
import WindowsNotificationUtils from "./private/windowsNotificationUtils";
import {initializeInterop} from "./private/interopUtils";
import {setPlatformUtils} from "shared/util/platformUtils";
import WindowsPlatformUtils from "./private/windowsPlatformUtils";

//Setting platform-specific utilities
setPeopleUtils(new WindowsPeopleUtils());
setNotificationUtils(new WindowsNotificationUtils());
setPlatformUtils(new WindowsPlatformUtils());

//Initializing interop
initializeInterop();