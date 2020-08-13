import React from 'react';
import ReactDOM from 'react-dom';

import * as serviceWorker from './serviceWorker';
import firebase from "firebase/app";
import "firebase/auth";

import AppTheme from './components/control/AppTheme';
import LoginGate from './components/control/LoginGate';

import './index.css';

//Initializing Firebase
firebase.initializeApp({
	apiKey: "AIzaSyDISPF10GUlqNg9zc7dNR4p_dckeQtLtQY",
	authDomain: "airmessage-b2c68.firebaseapp.com",
	databaseURL: "https://airmessage-b2c68.firebaseio.com",
	projectId: "airmessage-b2c68",
	storageBucket: "airmessage-b2c68.appspot.com",
	messagingSenderId: "557377230163",
	appId: "1:557377230163:web:2eaaa30deb17caf9373da6",
	measurementId: "G-W7NE8FK1WF",
	
	clientId: "557377230163-kt5ffj5r02i0cutuqntp28m65fg662k0.apps.googleusercontent.com",
	scopes: [
		"https://www.googleapis.com/auth/contacts.readonly"
	],
	discoveryDocs: [
		"https://people.googleapis.com/$discovery/rest?version=v1"
	]
});

//Initializing React
ReactDOM.render(
    <React.StrictMode>
		<AppTheme>
        	<LoginGate />
		</AppTheme>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();