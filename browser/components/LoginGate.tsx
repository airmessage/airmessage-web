import React from "react";

import Onboarding from "./private/Onboarding";
import Messaging from "shared/components/messaging/master/Messaging";

import * as secrets from "shared/secrets";

import * as Sentry from "@sentry/react";
import {promiseGAPI} from "shared/index";
import {googleScope} from "shared/constants";
import LoginContext from "shared/components/LoginContext";
import {getAuth, onAuthStateChanged, signInWithCredential, signOut, GoogleAuthProvider, User} from "firebase/auth";

type LoginState = "waiting" | "logged-out" | "logged-in";

interface State {
	state: LoginState
}

export default class LoginGate extends React.Component<any, State> {
	private unsubscribe: any;
	private googleAuthInstance: gapi.auth2.GoogleAuth | undefined;
	
	state: Readonly<State> = {
		state: "waiting"
	};
	
	render() {
		let main: React.ReactElement | null;
		switch(this.state.state) {
			case "waiting":
				main = null;
				break;
			case "logged-in":
				main = <Messaging />;
				break;
			case "logged-out":
				main = <Onboarding />;
				break;
		}
		
		return (
			<LoginContext.Provider value={{
				signOut: () => signOut(getAuth())
			}}>
				{main}
			</LoginContext.Provider>
		);
	}
	
	componentDidMount() {
		promiseGAPI.then(() => {
			gapi.load("auth2", () => {
				gapi.auth2.init({
					client_id: secrets.googleClientID,
					scope: googleScope,
				}).then(authInstance => {
					this.googleAuthInstance = authInstance;
					//authInstance.isSignedIn.listen(this.updateGoogleSignIn.bind(this));
					this.updateGoogleSignIn(authInstance.isSignedIn.get());
				});
			});
		});
		
		this.unsubscribe = onAuthStateChanged(getAuth(), (user) => {
			//Updating the state
			this.setState({
				state: user ? "logged-in" : "logged-out"
			});
			
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
			const unsubscribe = onAuthStateChanged(getAuth(), (firebaseUser) => {
				unsubscribe();
				
				//Returning if the same user is already signed in to Firebase
				if(isUserEqual(googleUser, firebaseUser)) return;
				
				//Signing in to Firebase with the credential from Google
				signInWithCredential(getAuth(), GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token)).catch((error) => {
					console.warn(`Unable to authenticate Google Sign-In token with Firebase: ${error.code}: ${error.message}`);
					this.googleAuthInstance!.signOut();
				});
				
				//firebase.analytics().logEvent("login", {method: firebase.auth.GoogleAuthProvider.PROVIDER_ID});
			});
		} else {
			//Signing out of Firebase
			signOut(getAuth());
		}
	}
}

function isUserEqual(googleUser: gapi.auth2.GoogleUser, firebaseUser: User | null) {
	if(firebaseUser) {
		const providerData = firebaseUser.providerData;
		for(let i = 0; i < providerData.length; i++) {
			if(providerData[i]!.providerId === GoogleAuthProvider.PROVIDER_ID &&
				providerData[i]!.uid === googleUser.getBasicProfile().getId()) {
				// We don't need to reauth the Firebase connection.
				return true;
			}
		}
	}
	
	return false;
}