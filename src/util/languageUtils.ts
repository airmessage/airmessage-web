import {ConnectionErrorCode} from "shared/data/stateCodes";
import {connect as connectToServer} from "shared/connection/connectionManager";
import {getAuth, signOut} from "firebase/auth";

export interface ErrorDisplay {
	message: string;
	button?: ButtonAction;
}

export interface ButtonAction {
	label: string;
	onClick: () => void;
}

const buttonActionRetry: ButtonAction = {
	label: "Retry",
	onClick: () => {
		connectToServer();
	}
};

/**
 * Maps a connection error code to a human-readable description and optional action
 * @param error The error code to map
 * @param isDirect Whether the connection is made directly to the server without the use of a proxy
 */
export function errorCodeToShortDisplay(error: ConnectionErrorCode, isDirect?: boolean): ErrorDisplay {
	switch(error) {
		case ConnectionErrorCode.Connection:
		case ConnectionErrorCode.Internet:
			return {
				message: isDirect ? "Server not reachable" : "No internet connection",
			};
		case ConnectionErrorCode.InternalError:
			return {
				message: "An internal error occurred",
				button: buttonActionRetry
			};
		case ConnectionErrorCode.ExternalError:
			return {
				message: "An external error occurred",
				button: buttonActionRetry
			};
		case ConnectionErrorCode.BadRequest:
			return {
				message: "A connection compatibility error occurred",
				button: buttonActionRetry
			};
		case ConnectionErrorCode.ClientOutdated:
			return {
				message: "App is out-of-date",
				button: {
					label: "Refresh",
					onClick: () => {
						window.location.reload();
					}
				}
			};
		case ConnectionErrorCode.ServerOutdated:
			return {
				message: "Server is out-of-date",
				button: buttonActionRetry
			};
		case ConnectionErrorCode.Unauthorized:
			return {
				message: "Password not accepted",
				button: buttonActionRetry
			};
		case ConnectionErrorCode.ConnectNoGroup:
			return {
				message: "Personal server not reachable",
				button: buttonActionRetry
			};
		case ConnectionErrorCode.ConnectNoCapacity:
			return {
				message: "Connected device limit reached",
				button: buttonActionRetry
			};
		case ConnectionErrorCode.ConnectAccountValidation:
			return {
				message: "Account verification error",
				button: {
					label: "Sign out",
					onClick: () => {
						signOut(getAuth());
					}
				}
			};
		case ConnectionErrorCode.ConnectNoActivation:
			return {
				message: "Account not activated"
			};
		case ConnectionErrorCode.ConnectOtherLocation:
			return {
				message: "Server computer swapped",
				button: {
					label: "Refresh",
					onClick: () => {
						window.location.reload();
					}
				}
			};
	}
}