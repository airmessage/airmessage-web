import React from "react";
import styles from "./ConnectionBanner.module.css";

import {Button, Paper, Typography} from "@mui/material";
import {WifiOffRounded} from "@mui/icons-material";
import {ConnectionErrorCode} from "../../../data/stateCodes";
import {errorCodeToShortDisplay} from "shared/util/languageUtils";

export default function ConnectionBanner(props: {error: ConnectionErrorCode}) {
	const errorDisplay = errorCodeToShortDisplay(props.error);
	
	return (
		<Paper variant="outlined" className={errorDisplay.button ? styles.rootButton : styles.rootText}>
			<WifiOffRounded className={styles.icon} />
			<div className={styles.stack}>
				<Typography display="inline">{errorDisplay.message}</Typography>
				{errorDisplay.button && <Button color="primary" className={styles.button} onClick={errorDisplay.button.onClick}>{errorDisplay.button.label}</Button>}
			</div>
		</Paper>
	);
}