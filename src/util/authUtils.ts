import {useEffect} from "react";
import {googleScope} from "shared/constants";
import {googleClientID, googleClientSecret} from "shared/secrets";

const stateCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const stateStorageKey = "oauthState";

const redirectURI = window.location.origin + "/";

export interface OAuthTokenResult {
	id_token: string;
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
}

export interface OAuthRefreshResult {
	access_token: string;
	expires_in: number;
	scope: string;
}

/**
 * Securely generates a random string of length
 */
function generateRandomString(length: number) {
	const buffer = new Uint8Array(length);
	crypto.getRandomValues(buffer);
		
	const state = [];
	for(const byte of buffer) {
		state.push(stateCharacters[byte % stateCharacters.length]);
	}
	return state.join("");
}

/**
 * Generates an OAuth2 URL, saves its state to
 * local storage, and redirects the browser
 */
function requestAuthorization(loginHint?: string) {
	const state = generateRandomString(8);
	localStorage.setItem(stateStorageKey, state);
	
	const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	url.searchParams.set("client_id", googleClientID);
	url.searchParams.set("redirect_uri", redirectURI);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("scope", googleScope);
	url.searchParams.set("state", state);
	url.searchParams.set("prompt", "consent select_account");
	url.searchParams.set("access_type", "offline");
	url.searchParams.set("include_granted_scopes", true.toString());
	if(loginHint !== undefined) {
		url.searchParams.set("login_hint", loginHint);
	}
	
	window.location.assign(url);
}

/**
 * Checks the URL for OAuth2 return values, and returns a code if available
 */
function continueAuthorization(): string | undefined {
	//Read the expected state
	const localState = localStorage.getItem(stateStorageKey);
	if(localState === null) return undefined;
	localStorage.removeItem(stateStorageKey);
	
	//Parse URL parameters
	const urlParams = new URLSearchParams(window.location.search);
	
	//Match the state
	const urlState = urlParams.get("state");
	const urlCode = urlParams.get("code");
	const urlError = urlParams.get("error");
	if(urlState !== localState) return undefined;
	
	//Check for a code
	if(urlError !== null) {
		return undefined;
	}
	if(urlCode === null) {
		return undefined;
	}
	
	//Reset the browser URL
	const updatedURL = new URL(window.location.href);
	updatedURL.search = "";
	window.history.replaceState(null, "", updatedURL);
	
	return urlCode;
}

/**
 * Exchanges an OAuth2 code with Google
 */
function exchangeOAuth2Code(
	code: string,
	redirectURI: string
): Promise<OAuthTokenResult> {
	return fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: new URLSearchParams({
			"client_id": googleClientID,
			"client_secret": googleClientSecret,
			"code": code,
			"grant_type": "authorization_code",
			"redirect_uri": redirectURI
		})
	}).then(async (response) => {
		const data = await response.json();
		if(!response.ok) {
			const error: string = data.error;
			throw new Error(`Got HTTP response ${response.status} (${error})`);
		}
		
		return data;
	});
}

/**
 * Exchanges an OAuth2 code with Google
 */
function refreshAccessToken(
	refreshToken: string,
): Promise<OAuthRefreshResult> {
	return fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: new URLSearchParams({
			"client_id": googleClientID,
			"client_secret": googleClientSecret,
			"grant_type": "refresh_token",
			"refresh_token": refreshToken
		})
	}).then((response) => {
		if(!response.ok) {
			throw new Error(`Got HTTP response ${response.status}`);
		}
		
		return response.json();
	});
}

//Check authorization state on page load
const initialAuthorizationCode = continueAuthorization();

/**
 * Hook function for integrating with Google sign-in
 * @param callback A callback invoked when the user signs in
 * @return
 * - Whether this session was launched in response to a sign-in session
 * - A function to start the sign-in process
 * - A function to exchange a refresh token for an access token
 */
export function useGoogleSignIn(callback: (result: OAuthTokenResult) => void): [boolean, (loginHint?: string) => void, (refreshToken: string) => Promise<OAuthRefreshResult>] {
	useEffect(() => {
		//Check for an authorization code
		if(initialAuthorizationCode === undefined) return;
		
		//Exchange the code and invoke the callback
		exchangeOAuth2Code(initialAuthorizationCode, redirectURI)
			.then((result) => callback(result));
	}, [callback]);
	
	const isAuthResponseSession = initialAuthorizationCode !== undefined;
	
	return [isAuthResponseSession, requestAuthorization, refreshAccessToken];
}

export class InvalidTokenError extends Error {
	
}
