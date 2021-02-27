import React, {useEffect, useState} from "react";
import QueuedAttachment, {QueuedAttachmentProps} from "./QueuedAttachment";

export function QueuedAttachmentImage(props: {queueData: QueuedAttachmentProps}) {
	const [imageURL, setImageURL] = useState<string | undefined>(undefined);
	
	useEffect(() => {
		//Cleaning up the current image URL
		if(imageURL) URL.revokeObjectURL(imageURL);
		
		//Creating a new image URL
		setImageURL(URL.createObjectURL(new Blob([props.queueData.file], {type: props.queueData.file.type})));
		
		return () => {
			if(imageURL) URL.revokeObjectURL(imageURL);
		};
	}, [props.queueData.file]);
	
	return (
		<QueuedAttachment queueData={props.queueData}>
			<img src={imageURL} alt="" />
		</QueuedAttachment>
	);
}