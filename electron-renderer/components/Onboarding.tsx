import React, {useCallback, useState} from "react";
import styles from "./Onboarding.module.css";

import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import iconAirMessage from "shared/icons/tile-airmessage.svg";
import iconMac from "shared/icons/tile-mac.svg";

import AirMessageLogo from "shared/components/logo/AirMessageLogo";
import EthernetIcon from "../icon/EthernetIcon";
import ConnectionConfigDialog from "./ConnectionConfigDialog";

const {shell} = require("electron");

export default function Onboarding(props: {onApplyConfig: VoidFunction}) {
	const [showConfigDialog, setShowConfigDialog] = useState(false);
	
	const navigateWebsite = useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		shell.openExternal("https://airmessage.org");
	}, []);
	
	return (
		<div className={styles.root}>
			<ConnectionConfigDialog isOpen={showConfigDialog} onDismiss={() => setShowConfigDialog(false)} onApplyConfig={props.onApplyConfig} />
			
			<div style={{padding: 16}}>
				<AirMessageLogo />
			</div>
			
			<div className={styles.content}>
				<div>
					<Typography variant="h4">Use iMessage on any computer with AirMessage</Typography>
					<div className={styles.columnContainer}>
						<div className={styles.textColumn} style={{marginRight: 24}}>
							<div className={styles.instruction}>
								<img src={iconMac} className={styles.instructionIcon} alt="" />
								<div className={styles.instructionText} style={{top: 0}}>
									<Typography variant="h5" gutterBottom>1. Set up your server</Typography>
									<Typography variant="body1" color="textSecondary" gutterBottom>A server installed on a Mac computer is required to route your messages for you.</Typography>
									<Typography variant="body1" color="textSecondary">Visit <a style={{color: "#008EFF"}} href="https://airmessage.org" onClick={navigateWebsite}>airmessage.org</a> on a Mac computer to download.</Typography>
								</div>
							</div>
							
							<div className={styles.instruction} style={{marginTop: 24}}>
								<img src={iconAirMessage} className={styles.instructionIcon} alt="" />
								<div className={styles.instructionText} style={{top: 0}}>
									<Typography variant="h5" gutterBottom>2. Configure and connect</Typography>
									<Typography variant="body1" color="textSecondary">Connect to your server to get your messages on this device.</Typography>
								</div>
							</div>
						</div>
						
						<div className={styles.buttonColumn} style={{marginLeft: 24, flexGrow: 1}}>
							<Typography variant="subtitle1" gutterBottom>Select a sign-in method:</Typography>
							{/*<Button className={styles.buttonGoogle} variant="contained" startIcon={<img src={iconGoogle} alt="" />} style={{marginTop: 4}} onClick={signInGoogle} fullWidth>Sign in with Google</Button>*/}
							<Button className={styles.buttonManual} variant="outlined" startIcon={<EthernetIcon />} style={{marginTop: 8}} onClick={() => setShowConfigDialog(true)} fullWidth>Use manual configuration</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}