import React from "react";
import styles from "./ConnectionBanner.module.css";

import {Button, Paper, Typography} from "@material-ui/core";
import WifiOffRoundedIcon from "@material-ui/icons/WifiOffRounded";
import {ConnectionErrorCode} from "../../../data/stateCodes";
import {errorCodeToShortDisplay} from "shared/util/languageUtils";

export default function ConnectionBanner(props: {error: ConnectionErrorCode}) {
	const errorDisplay = errorCodeToShortDisplay(props.error);
	
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