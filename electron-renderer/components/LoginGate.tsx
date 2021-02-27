import React, {useState} from "react";

import Onboarding from "./private/Onboarding";
import Messaging from "shared/components/messaging/master/Messaging";

export default function LoginGate() {
	const [hasConfig, setHasConfig] = useState(false);
	
	if(hasConfig) {
		return <Messaging />;
	} else {
		return <Onboarding onApplyConfig={() => setHasConfig(true)} />;
	}
}