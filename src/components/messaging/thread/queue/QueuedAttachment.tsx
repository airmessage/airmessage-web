import React from "react";
import styles from "./QueuedAttachment.module.css";
import BorderedCloseIcon from "../../../icon/BorderedCloseIcon";
import {IconButton, Tooltip} from "@material-ui/core";

export interface QueuedAttachmentProps {
	file: File;
	onRemove: () => void;
}

export default function QueuedAttachment(props: {children: React.ReactNode, queueData: QueuedAttachmentProps}) {
	return (
		<div className={styles.container}>
			<Tooltip title={props.queueData.file.name}>
				<div className={styles.subcontainer}>
					{props.children}
					<IconButton size="small" className={styles.close} onClick={props.queueData.onRemove}><BorderedCloseIcon /></IconButton>
				</div>
			</Tooltip>
		</div>
	);
}