import {setPeopleUtils} from "shared/util/peopleUtils";
import WindowsPeopleUtils from "./private/windowsPeopleUtils";
import {setNotificationUtils} from "shared/util/notificationUtils";
import WindowsNotificationUtils from "./private/windowsNotificationUtils";

//Setting platform-specific utilities
setPeopleUtils(new WindowsPeopleUtils());
setNotificationUtils(new WindowsNotificationUtils());