import React from "react";
import {createRoot} from "react-dom/client";
import * as Sentry from "@sentry/react";
import SignInGate from "shared/components/SignInGate";
import AppTheme from "./components/control/AppTheme";
import {initializeApp} from "firebase/app";
import * as secrets from "./secrets";
import {setPeopleUtils} from "shared/interface/people/peopleUtils";
import GooglePeopleUtils from "shared/interface/people/googlePeopleUtils";
import {setNotificationUtils} from "shared/interface/notification/notificationUtils";
import BrowserNotificationUtils from "shared/interface/notification/browserNotificationUtils";
import {setPlatformUtils} from "shared/interface/platform/platformUtils";
import BrowserPlatformUtils from "shared/interface/platform/browserPlatformUtils";

//Set platform-specific utilities
setPeopleUtils(new GooglePeopleUtils());
setNotificationUtils(new BrowserNotificationUtils());
setPlatformUtils(new BrowserPlatformUtils());

//Initializing Sentry
if(WPEnv.ENVIRONMENT === "production") {
	Sentry.init({
		dsn: secrets.sentryDSN,
		release: "airmessage-web@" + WPEnv.PACKAGE_VERSION,
		environment: WPEnv.ENVIRONMENT
	});
}

//Initializing Firebase
initializeApp(secrets.firebaseConfig);

// Check that service workers are supported
if(WPEnv.ENVIRONMENT === "production" && "serviceWorker" in navigator) {
	// Use the window load event to keep the page load performant
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/service-worker.js");
	});
}

//Loading the Google platform script
export const promiseGAPI = new Promise<unknown>((resolve) => {
	const script = document.createElement("script");
	script.setAttribute("src","https://apis.google.com/js/platform.js");
	script.onload = resolve;
	document.head.appendChild(script);
});

//Initializing React
const root = createRoot(document.getElementById("root")!);
root.render(
	<React.StrictMode>
		<AppTheme>
			<SignInGate />
		</AppTheme>
	</React.StrictMode>
);