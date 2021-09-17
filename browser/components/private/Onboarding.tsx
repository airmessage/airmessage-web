import React from "react";
import styles from "./Onboarding.module.css";

import {Typography, Button} from "@mui/material";
import iconAirMessage from "shared/resources/icons/tile-airmessage.svg";
import iconMac from "shared/resources/icons/tile-mac.svg";
import iconGoogle from "shared/resources/icons/logo-google.svg";

import AirMessageLogo from "shared/components/logo/AirMessageLogo";
import {googleScope} from "shared/constants";

export default function Onboarding() {
	return (
		<div className={styles.root}>
			<div style={{padding: 16}}>
				<AirMessageLogo />
			</div>

			<div className={styles.content}>
				<div>
					<Typography variant="h4">Use iMessage on any computer with AirMessage</Typography>
					<div className={styles.columnContainer}>
						<div className={styles.column} style={{marginRight: 24}}>
							<div className={styles.instruction}>
								<img src={iconMac} className={styles.instructionIcon} alt="" />
								<div className={styles.instructionText} style={{top: 0}}>
									<Typography variant="h5" gutterBottom>1. Set up your server</Typography>
									<Typography variant="body1" color="textSecondary" gutterBottom>A server installed on a Mac computer is required to route your messages for you.</Typography>
									<Typography variant="body1" color="textSecondary">Visit <a href="https://airmessage.org" style={{color: "#008EFF"}}>airmessage.org</a> on a Mac computer to download.</Typography>
								</div>
							</div>

							<div className={styles.instruction} style={{marginTop: 24}}>
								<img src={iconAirMessage} className={styles.instructionIcon} alt="" />
								<div className={styles.instructionText} style={{top: 0}}>
									<Typography variant="h5" gutterBottom>2. Connect your account</Typography>
									<Typography variant="body1" color="textSecondary">Sign in with your account to get your messages on this device.</Typography>
								</div>
							</div>
						</div>

						<div className={styles.column} style={{marginLeft: 24, flexGrow: 1}}>
							<Typography variant="subtitle1" gutterBottom>Select a sign-in method:</Typography>
							<Button className={styles.buttonGoogle} variant="contained" startIcon={<img src={iconGoogle} alt="" />} style={{marginTop: 4}} onClick={signInGoogle} fullWidth>Sign in with Google</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function signInGoogle() {
	gapi.auth2.getAuthInstance().signIn({
		scope: googleScope,
		ux_mode: "redirect"
	});

	/* const provider = new firebase.auth.GoogleAuthProvider();
	provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
	firebase.auth().signInWithRedirect(provider); */
}