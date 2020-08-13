import React from "react";
import styles from "./SoftDivider.module.css";

import {useTheme} from "@material-ui/core";

export default function SoftDivider(props: {vertical?: boolean}) {
	const color = useTheme().palette.divider;
	
	return (
		<div className={props.vertical ? styles.vertical : styles.horizontal} style={{backgroundColor: color}} />
	)
}