import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import * as config from "./secure/config";

import AppTheme from "./components/control/AppTheme";
import LoginGate from "./components/control/LoginGate";

import * as serviceWorker from "./serviceWorker";

import firebase from "firebase/app";
import "firebase/auth";
//import "firebase/analytics";

import * as Sentry from "@sentry/react";

//Initializing Firebase
firebase.initializeApp(config.firebaseConfig);
//firebase.analytics();

//Initializing Sentry
if(process.env.NODE_ENV === "production") {
	Sentry.init({
		dsn: "https://38dc0e905711458d9f5a96371cb93642@o136515.ingest.sentry.io/5438890",
		release: process.env.REACT_APP_VERSION,
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
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();