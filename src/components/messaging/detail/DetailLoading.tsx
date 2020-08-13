import React from "react";
import styles from "./DetailLoading.module.css";

import {LinearProgress, Typography} from "@material-ui/core";

export default class DetailLoading extends React.Component {
	render() {
		return (
			<div className={styles.main}>
				<Typography color="textSecondary">Getting your messages&#8230;</Typography>
				<LinearProgress className={styles.progress} />
			</div>
		);
	}
}