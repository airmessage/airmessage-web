import React from "react";
import styles from "./ConnectionBanner.module.css";

import {Button, Paper, Typography} from "@material-ui/core";
import WifiOffRoundedIcon from "@material-ui/icons/WifiOffRounded";
import {ConnectionErrorCode} from "../../../data/stateCodes";
import {connect as connectToServer} from "../../../connection/connectionManager";
import firebase from "firebase/app";
import "firebase/auth";

interface ErrorDisplay {
	message: string;
	button?: ButtonAction;
}

interface ButtonAction {
	label: string;
	onClick: () => void;
}

const buttonActionRetry: ButtonAction = {
	label: "Retry",
	onClick: () => {
		connectToServer();
	}
};

export default function ConnectionBanner(props: {error: ConnectionErrorCode}) {
	const errorDisplay = errorCodeToDisplay(props.error);
	
	return (
		<Paper variant="outlined" className={errorDisplay.button ? styles.rootButton : styles.rootText}>
			<WifiOffRoundedIcon className={styles.icon} />
			<div className={styles.stack}>
				<Typography display="inline">{errorDisplay.message}</Typography>
				{errorDisplay.button && <Button color="primary" className={styles.button} onClick={errorDisplay.button.onClick}>{errorDisplay.button.label}</Button>}
			</div>
		</Paper>
	);
}

function errorCodeToDisplay(error: ConnectionErrorCode): ErrorDisplay {
	switch(error) {
		case ConnectionErrorCode.Connection:
		case ConnectionErrorCode.Internet:
			return {
				message: "No internet connection",
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
						firebase.auth().signOut();
					}
				}
			};
		case ConnectionErrorCode.ConnectNoSubscription:
			return {
				message: "Subscription expired"
			};
		case ConnectionErrorCode.ConnectOtherLocation:
			return {
				message: "Server computer swapped"
			};
	}
}