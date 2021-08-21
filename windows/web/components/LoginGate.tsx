import React, {useCallback, useState} from "react";

import Onboarding from "./private/Onboarding";
import Messaging from "shared/components/messaging/master/Messaging";
import {getSecureLS, SecureStorageKey, setSecureLS} from "shared/util/secureStorageUtils";
import {setDisableAutomaticReconnections} from "shared/connection/connectionManager";
import LoginContext from "shared/components/LoginContext";

export default function LoginGate() {
	const [hasConfig, setHasConfig] = useState(() => {
		return getSecureLS(SecureStorageKey.ServerAddress) !== undefined &&
			getSecureLS(SecureStorageKey.ServerPassword) !== undefined;
	});
	
	const applyConfig = useCallback(() => {
		setHasConfig(true);
	}, [setHasConfig]);
	
	const reset = useCallback(() => {
		setHasConfig(false);
		setDisableAutomaticReconnections(true);
	}, [setHasConfig]);
	
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
			}, [])
		}}>
			{hasConfig ? (
				<Messaging resetCallback={reset} />
			) : (
				<Onboarding onApplyConfig={applyConfig} />
			)}
		</LoginContext.Provider>
	);
}