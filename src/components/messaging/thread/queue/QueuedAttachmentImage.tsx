import React from "react";
import QueuedAttachment, {QueuedAttachmentProps} from "./QueuedAttachment";
import {useBlobURL} from "shared/util/hookUtils";

export function QueuedAttachmentImage(props: {queueData: QueuedAttachmentProps}) {
	const imageURL = useBlobURL(props.queueData.file, props.queueData.file.type);
	
	return (
		<QueuedAttachment queueData={props.queueData}>
			<img src={imageURL} alt="" />
		</QueuedAttachment>
	);
}