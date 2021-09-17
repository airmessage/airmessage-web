import React from "react";
import styles from "./ConversationActionLine.module.css";
import {Typography} from "@mui/material";

export default function ConversationActionLine(props: {message: string}) {
	return <Typography className={styles.main} variant="body2" color="textSecondary">{props.message}</Typography>;
}