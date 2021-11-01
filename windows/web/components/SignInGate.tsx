import React, {useCallback, useEffect, useState} from "react";

import Onboarding from "./private/Onboarding";
import Messaging from "shared/components/messaging/master/Messaging";
import {getSecureLS, SecureStorageKey, setSecureLS} from "shared/util/secureStorageUtils";
import {disconnect, setDisableAutomaticReconnections} from "shared/connection/connectionManager";
import LoginContext from "shared/components/LoginContext";

export default function SignInGate() {
	const [hasConfig, setHasConfig] = useState<undefined | boolean>(undefined);
	useEffect(() => {
		//If all values are set, jump straight to messaging
		//Otherwise, ask the user to enter their server settings
		Promise.all([
			getSecureLS(SecureStorageKey.ServerAddress),
			getSecureLS(SecureStorageKey.ServerPassword)
		]).then((results) => {
			setHasConfig(results.every((it) => it !== undefined));
		});
	}, [setHasConfig]);
	
	const applyConfig = useCallback(() => {
		setHasConfig(true);
	}, [setHasConfig]);
	
	const reset = useCallback(() => {
		setHasConfig(false);
		setDisableAutomaticReconnections(true);
	}, [setHasConfig]);
	
	let main: React.ReactElement | null;
	switch(hasConfig) {
		case undefined:
			main = null;
			break;
		case false:
			main = <Onboarding onApplyConfig={applyConfig} />;
			break;
		case true:
			main = <Messaging resetCallback={reset} />;
			break;
	}
	
	return (
		<LoginContext.Provider value={{
			signOut: useCallback(() => {
				//Reset state
				setHasConfig(false);
				setDisableAutomaticReconnections(true);
				
				//Clear configuration
				setSecureLS(SecureStorageKey.ServerAddress, undefined);
				setSecureLS(SecureStorageKey.ServerAddressFallback, undefined);
				setSecureLS(SecureStorageKey.ServerPassword, undefined);
				
				//Disconnect
				disconnect();
			}, [])
		}}>
			{main}
		</LoginContext.Provider>
	);
}