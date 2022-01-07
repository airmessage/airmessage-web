import React from "react";
import styles from "./SidebarBanner.module.css";

import {Button, Paper, Typography} from "@mui/material";

export default function SidebarBanner(props: {
	icon: React.ReactNode,
	message: string,
	button?: string,
	onClickButton?: VoidFunction
}) {
	return (
		<Paper variant="outlined" className={props.button != undefined ? styles.rootButton : styles.rootText}>
			<div className={styles.icon}>
				{props.icon}
			</div>
			
			<div className={styles.stack}>
				<Typography display="inline">{props.message}</Typography>
				{props.button !== undefined && (
					<Button color="primary" className={styles.button} onClick={props.onClickButton}>{props.button}</Button>
				)}
			</div>
		</Paper>
	);
}