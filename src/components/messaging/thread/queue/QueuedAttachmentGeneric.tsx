import React from "react";
import styles from "./QueuedAttachmentGeneric.module.css";

import {useTheme} from "@mui/material/styles";
import {InsertDriveFileRounded} from "@mui/icons-material";
import QueuedAttachment, {QueuedAttachmentProps} from "./QueuedAttachment";

export default function QueuedAttachmentGeneric(props: {queueData: QueuedAttachmentProps}) {
	const theme = useTheme();
	
	return (
		<QueuedAttachment queueData={props.queueData}>
			<div className={styles.content} style={{backgroundColor: theme.palette.background.default}}>
				<InsertDriveFileRounded />
			</div>
		</QueuedAttachment>
	);
}