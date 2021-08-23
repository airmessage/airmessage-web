import {setPeopleUtils} from "shared/util/peopleUtils";
import GooglePeopleUtils from "platform-components/private/googlePeopleUtils";
import {setNotificationUtils} from "shared/util/notificationUtils";
import BrowserNotificationUtils from "platform-components/private/browserNotificationUtils";

//Setting platform-specific utilities
setPeopleUtils(new GooglePeopleUtils());
setNotificationUtils(new BrowserNotificationUtils());