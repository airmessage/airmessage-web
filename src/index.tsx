import React from "react";
import ReactDOM from "react-dom";

import * as config from "./secure/config";

import AppTheme from "./components/control/AppTheme";
import LoginGate from "platform-components/components/LoginGate";

import firebase from "firebase/app";

import * as Sentry from "@sentry/react";

export let promiseGAPI: Promise<any>;

//Initializing Sentry
if(process.env.NODE_ENV === "production") {
	Sentry.init({
		dsn: config.sentryDSN,
		release: "airmessage-web@" + WPEnv.PACKAGE_VERSION,
		environment: process.env.NODE_ENV
	});
}

//Browser-specific features
if(!WPEnv.IS_ELECTRON) {
	//Initializing Firebase
	firebase.initializeApp(config.firebaseConfig);
	
	// Check that service workers are supported
	if(process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
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