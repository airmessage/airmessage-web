import React from "react";
import styles from "./QueuedAttachmentImage.module.css";
import QueuedAttachment, {QueuedAttachmentProps} from "./QueuedAttachment";
import {useBlobURL} from "shared/util/hookUtils";

export function QueuedAttachmentImage(props: {queueData: QueuedAttachmentProps}) {
	const imageURL = useBlobURL(props.queueData.file, props.queueData.file.type);
	
	return (
		<QueuedAttachment queueData={props.queueData}>
			<img className={styles.image} src={imageURL} alt="" />
		</QueuedAttachment>
	);
}