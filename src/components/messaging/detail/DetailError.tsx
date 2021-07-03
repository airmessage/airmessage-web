import React from "react";
import styles from "./DetailError.module.css";
import {Button, Typography} from "@material-ui/core";
import WifiOffRoundedIcon from "@material-ui/icons/WifiOffRounded";
import {ConnectionErrorCode} from "../../../data/stateCodes";
import {connect as connectToServer} from "../../../connection/connectionManager";
import firebase from "firebase/app";
import "firebase/auth";

interface ErrorDisplay {
	title: string;
	subtitle: string;
	buttonPrimary?: ButtonAction;
	buttonSecondary?: ButtonAction;
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

/* const buttonActionMoreInfo: ButtonAction = {
	label: "More info",
	onClick: () => {
	
	}
}; */

export default function DetailError(props: {error: ConnectionErrorCode}) {
	const errorDisplay = errorCodeToDisplay(props.error);
	
	return (
		<div className={styles.container}>
			<div className={styles.main}>
				<WifiOffRoundedIcon className={styles.icon} />
				<div className={styles.split}>
					<Typography variant="h4" gutterBottom>{errorDisplay.title}</Typography>
					<Typography color="textSecondary" gutterBottom dangerouslySetInnerHTML={{__html: errorDisplay.subtitle}} />
					<div className={styles.buttonRow}>
						{errorDisplay.buttonPrimary && <Button variant="contained" disableElevation onClick={errorDisplay.buttonPrimary.onClick}>{errorDisplay.buttonPrimary.label}</Button>}
						{errorDisplay.buttonSecondary && <Button onClick={errorDisplay.buttonSecondary.onClick}>{errorDisplay.buttonSecondary.label}</Button>}
					</div>
				</div>
			</div>
		</div>
	);
}

const errorTitleSystems = "An error occurred while connecting";

function errorCodeToDisplay(error: ConnectionErrorCode): ErrorDisplay {
	switch(error) {
		case ConnectionErrorCode.Connection:
		case ConnectionErrorCode.Internet:
			return {
				title: "AirMessage can't be reached",
				subtitle: "Please check your internet connection and try again",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.InternalError:
			return {
				title: errorTitleSystems,
				subtitle: "An internal error occurred while trying to connect",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.ExternalError:
			return {
				title: errorTitleSystems,
				subtitle: "An external error occurred while trying to connect",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.BadRequest:
			return {
				title: errorTitleSystems,
				subtitle: "A connection compatibility error occurred",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.ClientOutdated:
			return {
				title: "AirMessage for web isn't compatible with your personal server",
				subtitle: "This version of AirMessage for web is out of date - please refresh the page and try again",
				buttonPrimary: {
					label: "Refresh",
					onClick: () => {
						window.location.reload();
					}
				}
			};
		case ConnectionErrorCode.ServerOutdated:
			return {
				title: "AirMessage for web isn't compatible with your personal server",
				subtitle: "AirMessage Server is out of date - please update AirMessage Server on your Mac and try again",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.DirectUnauthorized:
			return {
				title: "Your password was not accepted",
				subtitle: "Please check your password and try again",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.ConnectNoGroup:
			return {
				title: "Your personal server can't be reached",
				subtitle: "Please ensure that your Mac is turned on, connected to the internet, and is running AirMessage Server",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.ConnectNoCapacity:
			return {
				title: "Too many devices are connected",
				subtitle: "You've reached your limit of connected devices. Please disconnect some other AirMessage devices from your account to continue.",
				buttonPrimary: buttonActionRetry
			};
		case ConnectionErrorCode.ConnectAccountValidation:
			return {
				title: "Your account details couldn't be processed",
				subtitle: "Please sign out of AirMessage for web and sign back in",
				buttonPrimary: {
					label: "Sign out",
					onClick: () => {
						firebase.auth().signOut();
					}
				}
			};
		case ConnectionErrorCode.ConnectNoActivation:
			return {
				title: "Your account isn't activated",
				subtitle: "Unfortunately, AirMessage Cloud is not accepting new users at this moment. Please try again later.",
			};
		case ConnectionErrorCode.ConnectOtherLocation:
			return {
				title: "A change was detected in your server computer",
				subtitle: "Please try connecting again in a few moments",
				buttonPrimary: buttonActionRetry
			};
	}
}