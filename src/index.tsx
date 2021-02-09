import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import * as config from "./secure/config";

import AppTheme from "./components/control/AppTheme";
import LoginGate from "./components/control/LoginGate";

import firebase from "firebase/app";
import "firebase/auth";

import * as Sentry from "@sentry/react";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";

//Initializing Firebase
firebase.initializeApp(config.firebaseConfig);

//Initializing Sentry
if(process.env.NODE_ENV === "production") {
	Sentry.init({
		dsn: config.sentryDSN,
		release: "airmessage-web@" + process.env.REACT_APP_VERSION,
		environment: process.env.NODE_ENV
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();