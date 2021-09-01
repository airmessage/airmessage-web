import React, {useContext, useState} from "react";
import styles from "../item/Message.module.css";
import stylesAttachment from "./MessageAttachmentDownloadable.module.css";

import {mimeTypeToPreview} from "../../../../util/conversationUtils";
import {ButtonBase, CircularProgress} from "@material-ui/core";
import GetAppRoundedIcon from "@material-ui/icons/GetAppRounded";
import {formatFileSize} from "../../../../util/fileUtils";
import * as ConnectionManager from "../../../../connection/connectionManager";
import {DecorativeMessageBubble, MessagePartProps} from "../item/Message";
import {StickerItem, TapbackItem} from "../../../../data/blocks";
import {SnackbarContext} from "../../../control/SnackbarProvider";
import {AttachmentRequestErrorCode} from "../../../../data/stateCodes";
import FileDownloadResult from "shared/data/fileDownloadResult";

export default function MessageAttachmentDownloadable(props: {
	data?: ArrayBuffer | Blob,
	name: string | undefined,
	type: string,
	size: number,
	guid: string,
	onDataAvailable: (result: FileDownloadResult) => void,
	onDataClicked: (data: ArrayBuffer | Blob) => void,
	partProps: MessagePartProps,
	tapbacks?: TapbackItem[],
	stickers?: StickerItem[]}
) {
	//State
	const [isDownloading, setIsDownloading] = useState(false);
	const [sizeAvailable, setSizeAvailable] = useState(props.size);
	const [sizeDownloaded, setSizeDownloaded] = useState<number | undefined>(undefined);
	
	const displaySnackbar = useContext(SnackbarContext);
	
	//Display the file name if it is available, otherwise just display the file type
	const nameDisplay = props.name ?? mimeTypeToPreview(props.type);
	
	function startDownload() {
		//Checking if data is already available
		if(props.data) {
			props.onDataClicked(props.data);
			return;
		}
		
		//Setting the state as downloading
		setIsDownloading(true);
		
		//Sending the request and setting the state to downloading
		ConnectionManager.fetchAttachment(props.guid)
			.progress((progress) => {
				if(progress.type === "size") {
					setSizeAvailable(progress.value);
				} else {
					setSizeDownloaded(progress.value);
				}
			})
			.then((fileData) => {
				//Calling the listener
				props.onDataAvailable(fileData);
				
				//Resetting the state
				setIsDownloading(false);
				setSizeDownloaded(undefined);
			})
			.catch((error: AttachmentRequestErrorCode) => {
				//Resetting the state
				setIsDownloading(false);
				setSizeDownloaded(undefined);
				
				//Notifying the user with a snackbar
				displaySnackbar({message: "Failed to download attachment: " + errorCodeToMessage(error)});
			});
	}
	
	return (
		<DecorativeMessageBubble element={ButtonBase} className={`${styles.textBubble} ${stylesAttachment.root}`} style={props.partProps} disabled={isDownloading} onClick={startDownload} tapbacks={props.tapbacks} stickers={props.stickers}>
			<div className={stylesAttachment.icon}>
				{
					isDownloading ?
						<CircularProgress size={24} variant={sizeDownloaded === undefined ? "indeterminate" : "determinate"} value={(sizeDownloaded ?? 0) / sizeAvailable * 100} style={{color: props.partProps.color}} /> :
						<GetAppRoundedIcon />
				}
			</div>
			<div className={stylesAttachment.description}>
				<span>{nameDisplay}</span>
				<br />
				<span className={stylesAttachment.descriptionSecondary}>{
					isDownloading ?
						formatFileSize(sizeDownloaded ?? 0) + " of " + formatFileSize(sizeAvailable):
						formatFileSize(sizeAvailable) + " • Click to download"}
				</span>
			</div>
		</DecorativeMessageBubble>
	);
}

function errorCodeToMessage(error: AttachmentRequestErrorCode): string {
	switch(error) {
		case AttachmentRequestErrorCode.Timeout:
			return "Request timed out";
		case AttachmentRequestErrorCode.BadResponse:
			return "A communication error occurred";
		case AttachmentRequestErrorCode.ServerUnknown:
			return "An unknown external error occurred";
		case AttachmentRequestErrorCode.ServerNotFound:
			return "Message not found";
		case AttachmentRequestErrorCode.ServerNotSaved:
			return "Attachment file not found";
		case AttachmentRequestErrorCode.ServerUnreadable:
			return "No permission to read file";
		case AttachmentRequestErrorCode.ServerIO:
			return "Failed to read file";
	}
}