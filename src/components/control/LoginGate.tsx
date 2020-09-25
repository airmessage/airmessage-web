import React from 'react';

import Onboarding from '../onboarding/Onboarding';
import Messaging from '../messaging/master/Messaging';

import firebase from "firebase/app";
import "firebase/auth";
//import "firebase/analytics";
import * as config from "../../secure/config";

import * as Sentry from "@sentry/react";

type LoginState = "waiting" | "logged-out" | "logged-in";

interface State {
	state: LoginState
}

export default class LoginGate extends React.Component<any, State> {
	private unsubscribe: any;
	private googleAuthInstance: gapi.auth2.GoogleAuth | undefined;
	
	state: Readonly<State> = {
		state: "waiting"
	}
	
	render() {
		switch(this.state.state) {
			case "waiting":
				return null;
			case "logged-in":
				return <Messaging />;
			case "logged-out":
				return <Onboarding />;
		}
	}
	
	componentDidMount() {
		gapi.load('auth2', () => {
			gapi.auth2.init({
				client_id: config.googleClientID,
				scope: config.googleScope,
				cookie_policy: "single_host_origin"
			}).then(authInstance => {
				this.googleAuthInstance = authInstance;
				//authInstance.isSignedIn.listen(this.updateGoogleSignIn.bind(this));
				this.updateGoogleSignIn(authInstance.isSignedIn.get());
			});
		});
		
		this.unsubscribe = firebase.auth().onAuthStateChanged((user) => {
			//Updating the state
			this.setState({
				state: user ? "logged-in" : "logged-out"
			})
			
			//Checking if the user is logged in
			if(user) {
				//Updating Sentry
				Sentry.setUser({
					id: user.uid,
					email: user.email ?? undefined
				});
			} else {
				//Signing out of Google
				if(this.googleAuthInstance && this.googleAuthInstance.isSignedIn.get()) {
					this.googleAuthInstance.signOut();
				}
			}
		});
	}
	
	componentWillUnmount() {
		if(this.unsubscribe) this.unsubscribe();
	}
	
	private updateGoogleSignIn(signedIn: boolean): void {
		if(signedIn) {
			//Getting the user
			const googleUser = this.googleAuthInstance!.currentUser.get();
			
			// We need to register an Observer on Firebase Auth to make sure auth is initialized.
			const unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
				unsubscribe();
				
				//Returning if the same user is already signed in to Firebase
				if(isUserEqual(googleUser, firebaseUser)) return;
				
				//Signing in to Firebase with the credential from Google
				firebase.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token)).catch((error) => {
					console.warn(`Unable to authenticate Google Sign-In token with Firebase: ${error.code}: ${error.message}`);
					this.googleAuthInstance!.signOut();
				});
				
				//firebase.analytics().logEvent("login", {method: firebase.auth.GoogleAuthProvider.PROVIDER_ID});
			});
		} else {
			//Signing out of Firebase
			firebase.auth().signOut();
		}
	}
}

function isUserEqual(googleUser: gapi.auth2.GoogleUser, firebaseUser: firebase.User | null) {
	if(firebaseUser) {
		const providerData = firebaseUser.providerData;
		for(let i = 0; i < providerData.length; i++) {
			if(providerData[i]!.providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
				providerData[i]!.uid === googleUser.getBasicProfile().getId()) {
				// We don't need to reauth the Firebase connection.
				return true;
			}
		}
	}
	
	return false;
}