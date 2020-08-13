import React, {ChangeEvent, useEffect, useState} from "react";
import styles from "./MessageInput.module.css";

import {useTheme} from '@material-ui/core/styles';
import {IconButton, InputBase} from "@material-ui/core";
import PushIcon from "../../icon/PushIcon";
import BorderedCloseIcon from "../../icon/BorderedCloseIcon";
import {QueuedFile} from "../../../data/blocks";
import {Flipped, Flipper, spring} from "react-flip-toolkit";

interface Props {
	placeholder: string;
	message: string;
	attachments: QueuedFile[];
	onMessageChange: (value: string) => void;
	onMessageSubmit: (message: string, attachments: QueuedFile[]) => void;
	onAttachmentRemove: (value: QueuedFile) => void;
}

export default function MessageInput(props: Props) {
	const theme = useTheme();
	const colorBG = theme.palette.messageIncoming.main;
	
	function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
		props.onMessageChange(event.target.value);
	}
	
	function handleKeyPress(event: React.KeyboardEvent<HTMLElement>) {
		if(!event.shiftKey && event.key === "Enter") {
			event.preventDefault();
			props.onMessageSubmit(props.message, props.attachments);
		}
	}
	
	function handleSubmitPress() {
		props.onMessageSubmit(props.message, props.attachments);
	}
	
	return (
		<div className={styles.root} style={{backgroundColor: colorBG}}>
			<Flipper flipKey={props.attachments.map(attachment => attachment.id).join(" ")}>
				{props.attachments.length > 0 &&
					<div className={styles.attachmentqueue}>
						{props.attachments.map((file) =>
							<Flipped flipId={"attachmentqueue-" + file.id} key={file.id} onAppear={onAttachmentAppear} onExit={onAttachmentExit}>
								<ImageAttachment file={file.file} onRemove={() => props.onAttachmentRemove(file)} />
							</Flipped>
						)}
					</div>
				}
				<div className={styles.control}>
					<InputBase className={styles.textfield} rowsMax="5" multiline fullWidth autoFocus placeholder={props.placeholder} value={props.message} onChange={handleChange} onKeyPress={handleKeyPress} />
					<IconButton size="small" color="primary" disabled={props.message.trim() === "" && props.attachments.length === 0} onClick={handleSubmitPress}><PushIcon /></IconButton>
				</div>
			</Flipper>
		</div>
	);
}

function onAttachmentAppear(element: HTMLElement) {
	spring({
		config: "stiff",
		onUpdate: (val) => {
			element.style.opacity = val.toString();
		}
	});
}

function onAttachmentExit(element: HTMLElement, index: number, removeElement: () => void) {
	spring({
		config: "stiff",
		onUpdate: (val) => {
			element.style.opacity = (1 - (val as number)).toString();
		},
		onComplete: removeElement
	});
}

export function ImageAttachment(props: {file: File, onRemove: () => void}) {
	const [imageURL, setImageURL] = useState<string | undefined>(undefined);
	
	useEffect(() => {
		//Cleaning up the current image URL
		if(imageURL) URL.revokeObjectURL(imageURL);
		
		//Creating a new image URL
		setImageURL(URL.createObjectURL(new Blob([props.file], {type: props.file.type})));
		
		return () => {
			if(imageURL) URL.revokeObjectURL(imageURL);
		};
	}, [props.file]);
	
	return (
		<div className={styles.queuedattachmentContainer}>
			<div className={styles.queuedattachmentSubcontainer}>
				<img className={styles.queuedattachmentContent} src={imageURL} alt="" />
				<IconButton size="small" className={styles.queuedattachmentClose} onClick={props.onRemove}><BorderedCloseIcon /></IconButton>
			</div>
		</div>
	);
}