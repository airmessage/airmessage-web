import {getCookie} from "./cookieUtils";
import {v4 as uuidv4} from "uuid";

const cookieName = "installationID";

export function getInstallationID(): string {
	const cookie = getCookie(cookieName);
	
	//Just return the installation ID cookie value if we already have one
	if(cookie) {
		return cookie;
	} else {
		//Generating a new installation ID
		const installationID = uuidv4();
		
		//Saving the installation ID to the browser's cookies
		const expiry = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000); //~4 months (120 days) from now
		document.cookie = `installationID=${installationID}; expires=${expiry.toUTCString()};`;
		
		//Returning the installation ID
		return installationID;
	}
}