import React, {useMemo, useState} from "react";
import * as secrets from "shared/secrets";

/**
 * Keeps track of which libraries are available to use
 */
export interface RemoteLibState {
	gapiLoaded: boolean;
	promiseGAPI: Promise<unknown>;
}

export const RemoteLibContext = React.createContext<RemoteLibState>({
	gapiLoaded: false,
	get promiseGAPI() {
		return Promise.reject("promiseGAPI unavailable since RemoteLibContext is not available");
	}
});

/**
 * Loads libraries in the background, and exposes to
 * consumers when libraries are available
 */
export function RemoteLibContextProvider(props: {children?: React.ReactNode}) {
	const [gapiLoaded, setGAPILoaded] = useState(false);
	
	//Load the Google platform script
	const promiseGAPI = useMemo(async () => {
		//Add the script element and wait for it to load
		await new Promise((resolve) => {
			const script = document.createElement("script");
			script.setAttribute("src", "https://apis.google.com/js/api.js");
			script.onload = resolve;
			document.head.appendChild(script);
		});
		
		//Load the client
		await new Promise((resolve) => {
			gapi.load("client", resolve);
		});
		
		//Load the people endpoint
		await gapi.client.init({
			apiKey: secrets.googleApiKey,
			discoveryDocs: ["https://people.googleapis.com/$discovery/rest?version=v1"]
		});
		
		//Update the state
		setGAPILoaded(true);
	}, [setGAPILoaded]);
	
	return (
		<RemoteLibContext.Provider value={{
			gapiLoaded,
			promiseGAPI
		}}>
			{props.children}
		</RemoteLibContext.Provider>
	);
}
