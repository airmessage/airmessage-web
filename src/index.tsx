import React from 'react';
import ReactDOM from 'react-dom';

import * as serviceWorker from './serviceWorker';
import firebase from "firebase/app";
import "firebase/auth";

import AppTheme from './components/control/AppTheme';
import LoginGate from './components/control/LoginGate';
import * as config from "./secure/config";

import './index.css';

//Initializing Firebase
firebase.initializeApp(config.firebaseConfig);

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