import {v4 as uuidv4} from "uuid";

const storageKey = "installationID";

export function getInstallationID(): string {
	const installationID = localStorage.getItem(storageKey);
	//Just return the installation ID value if we already have one
	if(installationID) {
		return installationID;
	} else {
		//Generating a new installation ID
		const installationID = uuidv4();
		
		//Saving the installation ID to local storage
		localStorage.setItem(storageKey, installationID);
		
		//Returning the installation ID
		return installationID;
	}
}