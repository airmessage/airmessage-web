import {setPeopleUtils} from "shared/util/peopleUtils";
import GooglePeopleUtils from "platform-components/private/googlePeopleUtils";
import {setNotificationUtils} from "shared/util/notificationUtils";
import BrowserNotificationUtils from "platform-components/private/browserNotificationUtils";
import {setPlatformUtils} from "shared/util/platformUtils";
import BrowserPlatformUtils from "platform-components/private/browserPlatformUtils";

//Setting platform-specific utilities
setPeopleUtils(new GooglePeopleUtils());
setNotificationUtils(new BrowserNotificationUtils());
setPlatformUtils(new BrowserPlatformUtils());