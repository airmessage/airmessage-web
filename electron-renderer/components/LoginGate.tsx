import React, {useState} from "react";

import Onboarding from "./private/Onboarding";
import Messaging from "shared/components/messaging/master/Messaging";
import {getSecureLS, SecureStorageKey} from "shared/util/secureStorageUtils";

export default function LoginGate() {
	const [hasConfig, setHasConfig] = useState(() => {
		return getSecureLS(SecureStorageKey.ServerAddress) !== undefined &&
			getSecureLS(SecureStorageKey.ServerPassword) !== undefined;
	});
	
	if(hasConfig) {
		return <Messaging />;
	} else {
		return <Onboarding onApplyConfig={() => setHasConfig(true)} />;
	}
}