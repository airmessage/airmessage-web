import React, {ChangeEvent, useCallback} from "react";
import styles from "./MessageInput.module.css";

import {useTheme} from "@material-ui/core/styles";
import {IconButton, InputBase} from "@material-ui/core";
import PushIcon from "../../icon/PushIcon";
import {QueuedFile} from "../../../data/blocks";
import {Flipped, Flipper, spring} from "react-flip-toolkit";
import {QueuedAttachmentImage} from "./queue/QueuedAttachmentImage";
import QueuedAttachmentGeneric from "./queue/QueuedAttachmentGeneric";
import {QueuedAttachmentProps} from "./queue/QueuedAttachment";

interface Props {
	placeholder: string;
	message: string;
	attachments: QueuedFile[];
	onMessageChange: (value: string) => void;
	onMessageSubmit: (message: string, attachments: QueuedFile[]) => void;
	onAttachmentAdd: (files: File[]) => void;
	onAttachmentRemove: (value: QueuedFile) => void;
}

export default function MessageInput(props: Props) {
	const theme = useTheme();
	const colorBG = theme.palette.messageIncoming.main;
	
	const {
		onMessageChange: propsOnMessageChange,
		onMessageSubmit: propsOnMessageSubmit,
		message: propsMessage,
		attachments: propsAttachments,
		onAttachmentAdd: propsOnAttachmentAdd
	} = props;
	
	const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
		propsOnMessageChange(event.target.value);
	}, [propsOnMessageChange]);
	
	const submitInput = useCallback(() => {
		propsOnMessageSubmit(propsMessage, propsAttachments);
	}, [propsOnMessageSubmit, propsMessage, propsAttachments]);
	
	const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
		if(!event.shiftKey && event.key === "Enter") {
			event.preventDefault();
			submitInput();
		}
	}, [submitInput]);
	
	const handlePaste = useCallback((event: React.ClipboardEvent<HTMLElement>) => {
		propsOnAttachmentAdd(Array.from(event.clipboardData.files));
	}, [propsOnAttachmentAdd]);
	
	return (
		<div className={styles.root} style={{backgroundColor: colorBG}}>
			<Flipper flipKey={props.attachments.map(attachment => attachment.id).join(" ")}>
				{props.attachments.length > 0 &&
					<div className={styles.attachmentqueue}>
						{props.attachments.map((file) => {
							const queueData: QueuedAttachmentProps = {
								file: file.file,
								onRemove: () => props.onAttachmentRemove(file)
							};
							
							let component: React.ReactNode;
							if(file.file.type.startsWith("image/")) component = <QueuedAttachmentImage queueData={queueData} />;
							else component = <QueuedAttachmentGeneric queueData={queueData} />;
							
							return (<Flipped flipId={"attachmentqueue-" + file.id} key={file.id} onAppear={onAttachmentAppear} onExit={onAttachmentExit}>
								{component}
							</Flipped>);
						})}
					</div>
				}
				<div className={styles.control}>
					<InputBase className={styles.textfield} rowsMax="5" multiline fullWidth autoFocus placeholder={props.placeholder} value={props.message} onChange={handleChange} onKeyPress={handleKeyPress} onPaste={handlePaste} />
					<IconButton size="small" color="primary" disabled={props.message.trim() === "" && props.attachments.length === 0} onClick={submitInput}><PushIcon /></IconButton>
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