import React, {useCallback, useState} from "react";

import Onboarding from "./private/Onboarding";
import Messaging from "shared/components/messaging/master/Messaging";
import {getSecureLS, SecureStorageKey} from "shared/util/secureStorageUtils";
import {setDisableAutomaticReconnections} from "shared/connection/connectionManager";

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
	
	if(hasConfig) {
		return <Messaging resetCallback={reset} />;
	} else {
		return <Onboarding onApplyConfig={applyConfig} />;
	}
}