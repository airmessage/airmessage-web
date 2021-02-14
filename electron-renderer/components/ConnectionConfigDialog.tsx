import {Button, Dialog, DialogContent, DialogTitle, TextField} from "@material-ui/core";
import React, {useState} from "react";
import styles from "./ConnectionConfigDialog.module.css";

const regexInternetAddress = "^(((www\\.)?[a-zA-Z0-9.\\-_]+(\\.[a-zA-Z]{2,})+)|(\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b))([a-zA-Z0-9_\\-\\s./?%#&=]*)?(:([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]?))?$";

function checkAddressError(input: string) {
	return input.length > 0 && !input.match(regexInternetAddress);
}

export default function ConnectionConfigDialog(props: {isOpen: boolean, onDismiss: () => void}) {
	const [address, setAddress] = useState("");
	const [fallbackAddress, setFallbackAddress] = useState("");
	const [password, setPassword] = useState("");
	
	const inputValid = address.match(regexInternetAddress) &&
		(fallbackAddress.length === 0 || fallbackAddress.match(regexInternetAddress)) &&
		password.length > 0;
	
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onDismiss}>
			<DialogTitle>Manual configuration</DialogTitle>
			<DialogContent>
				<TextField label="Server address" variant="filled" margin="normal" fullWidth
						   value={address} onChange={event => setAddress(event.target.value)}
						   error={checkAddressError(address)} />
				<TextField label="Fallback address (optional)" variant="filled" margin="normal" fullWidth
						   value={fallbackAddress} onChange={event => setFallbackAddress(event.target.value)}
						   error={checkAddressError(fallbackAddress)} />
				<TextField label="Password" variant="filled" type="password" autoComplete="current-password" margin="normal" fullWidth
						   value={password} onChange={event => setPassword(event.target.value)} />
				<div className={styles.bottomBar}>
					<Button variant="contained" color="primary" disabled={!inputValid}>Check connection</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}