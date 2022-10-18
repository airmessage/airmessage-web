import React, {useCallback, useContext, useEffect, useState} from "react";
import Onboarding from "shared/components/Onboarding";
import Messaging from "shared/components/messaging/master/Messaging";
import * as Sentry from "@sentry/react";
import LoginContext from "shared/components/LoginContext";
import {getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut} from "firebase/auth";
import {OAuthTokenResult, useGoogleSignIn} from "shared/util/authUtils";
import {PeopleContextProvider} from "shared/state/peopleState";
import {getSecureLS, SecureStorageKey, setSecureLS} from "shared/util/secureStorageUtils";
import {RemoteLibContext} from "shared/state/remoteLibProvider";

enum SignInState {
	Waiting,
	SignedOut,
	SignedIn
}

export default function SignInGate() {
	//Sign-in state
	const [state, setState] = useState(SignInState.Waiting);
	
	/**
	 * undefined - User is signed out, gAPI has no token
	 * null - User is signed in, gAPI has no token
	 * string - User is signed in, gAPI has token
	 */
	const [accessToken, setAccessToken] = useState<string | undefined | null>(undefined);
	const [accessTokenRegistered, setAccessTokenRegistered] = useState(false);
	
	const signOutAccount = useCallback(() => {
		//Sign out of Firebase
		signOut(getAuth());
		
		//Reset the access token
		setAccessToken(undefined);
		setSecureLS(SecureStorageKey.GoogleRefreshToken, undefined);
	}, [setAccessToken]);
	
	const handleGoogleSignIn = useCallback(async (result: OAuthTokenResult) => {
		//Sign in to Firebase
		try {
			await signInWithCredential(getAuth(), GoogleAuthProvider.credential(result.id_token));
		} catch(error) {
			console.warn("Unable to authenticate Google Sign-In token with Firebase:", error);
			return;
		}
		
		//Set the access token
		setAccessToken(result.access_token);
		setSecureLS(SecureStorageKey.GoogleRefreshToken, result.refresh_token);
	}, [setAccessToken]);
	
	const [isAuthResponseSession, signInWithGoogle, exchangeRefreshToken] = useGoogleSignIn(handleGoogleSignIn);
	
	//Apply the access token to gAPI
	const remoteLibState = useContext(RemoteLibContext);
	useEffect(() => {
		//Ignore if gAPI isn't loaded
		if(!remoteLibState.gapiLoaded) return;
		
		//Update the gAPI value
		if(accessToken) {
			gapi.client.setToken({access_token: accessToken});
		} else {
			gapi.client.setToken(null);
		}
		
		//If the access token is null, let people utils error out
		setAccessTokenRegistered(accessToken !== undefined);
	}, [accessToken, setAccessTokenRegistered, remoteLibState.gapiLoaded]);
	
	useEffect(() => {
		return onAuthStateChanged(getAuth(), (user) => {
			if(user == null) {
				//Update the state
				setState(SignInState.SignedOut);
			} else {
				//Update the state
				setState(SignInState.SignedIn);
				
				//Set the Sentry user
				Sentry.setUser({
					id: user.uid,
					email: user.email ?? undefined
				});
				
				//If this sign-in wasn't initiated by a sign-in session, load the token from disk
				if(!isAuthResponseSession) {
					(async () => {
						const refreshToken = await getSecureLS(SecureStorageKey.GoogleRefreshToken);
						
						//Ignore if we don't have a refresh token in local storage
						if(refreshToken === undefined) {
							console.warn("User is signed in, but no refresh token is available!");
							setAccessToken(null);
							return;
						}
						
						//Get a new access token with the refresh token
						let accessToken: string;
						try {
							const exchangeResult = await exchangeRefreshToken(refreshToken);
							accessToken = exchangeResult.access_token;
						} catch(error) {
							//Invalid token, ask user to reauthenticate
							console.warn(`Failed to exchange stored refresh token: ${error}`);
							signOutAccount();
							return;
						}
						
						//Set the access token
						setAccessToken(accessToken);
					})();
				}
			}
		});
	}, [setState, isAuthResponseSession, exchangeRefreshToken, signOutAccount]);
	
	let main: React.ReactElement | null;
	switch(state) {
		case SignInState.Waiting:
			main = null;
			break;
		case SignInState.SignedOut:
			main = (
				<Onboarding onSignInGoogle={signInWithGoogle} />
			);
			break;
		case SignInState.SignedIn:
			main = (
				<PeopleContextProvider ready={accessTokenRegistered}>
					<Messaging onReauthenticate={signInWithGoogle} />
				</PeopleContextProvider>
			);
			break;
	}
	
	return (
		<LoginContext.Provider value={{
			signOut: signOutAccount
		}}>
			{main}
		</LoginContext.Provider>
	);
}