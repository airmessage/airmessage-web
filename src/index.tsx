import React from "react";
import ReactDOM from "react-dom";
import firebase from "firebase/app";
import * as Sentry from "@sentry/react";
import LoginGate from "platform-components/components/LoginGate";
import AppTheme from "./components/control/AppTheme";
import * as secrets from "./secrets";

//Run initialization
import "platform-components/init";

export let promiseGAPI: Promise<any>;

//Initializing Sentry
if(WPEnv.ENVIRONMENT === "production") {
	Sentry.init({
		dsn: secrets.sentryDSN,
		release: "airmessage-web@" + WPEnv.PACKAGE_VERSION,
		environment: WPEnv.ENVIRONMENT
	});
}

//Browser-specific features
if(WPEnv.IS_WEB) {
	//Initializing Firebase
	firebase.initializeApp(secrets.firebaseConfig);
	
	// Check that service workers are supported
	if(WPEnv.ENVIRONMENT === "production" && "serviceWorker" in navigator) {
		// Use the window load event to keep the page load performant
		window.addEventListener("load", () => {
			navigator.serviceWorker.register("/service-worker.js");
		});
	}
	
	//Loading the Google platform script
	promiseGAPI = new Promise<any>((resolve) => {
		const script = document.createElement("script");
		script.setAttribute("src","https://apis.google.com/js/platform.js");
		script.onload = resolve;
		document.head.appendChild(script);
	});
}

//Initializing React
ReactDOM.render(
	<React.StrictMode>
		<AppTheme>
			<LoginGate />
		</AppTheme>
	</React.StrictMode>,
	document.getElementById("root")
);