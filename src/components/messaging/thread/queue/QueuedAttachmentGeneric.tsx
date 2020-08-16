import React from "react";
import styles from "./QueuedAttachmentGeneric.module.css";

import QueuedAttachment, {QueuedAttachmentProps} from "./QueuedAttachment";
import {useTheme} from "@material-ui/core";
import InsertDriveFileRoundedIcon from '@material-ui/icons/InsertDriveFileRounded';

export default function QueuedAttachmentGeneric(props: {queueData: QueuedAttachmentProps}) {
	const theme = useTheme();
	
	return (
		<QueuedAttachment queueData={props.queueData}>
			<div className={styles.content} style={{backgroundColor: theme.palette.background.default}}>
				<InsertDriveFileRoundedIcon />
			</div>
		</QueuedAttachment>
	);
}