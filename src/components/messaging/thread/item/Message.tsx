import React, {CSSProperties, useEffect, useState} from "react";
import styles from "./Message.module.css";

import * as Blocks from "../../../../data/blocks";
import {StickerItem, TapbackItem} from "../../../../data/blocks";
import {useTheme} from "@material-ui/core/styles";
import {
	Avatar, Button,
	CircularProgress,
	Dialog, DialogActions, DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Typography
} from "@material-ui/core";
import {getDeliveryStatusTime, getTimeDivider} from "../../../../util/dateUtils";
import {ContactData, findPerson} from "../../../../util/peopleUtils";
import {MessageErrorCode, MessageStatusCode} from "../../../../data/stateCodes";
import MessageAttachmentDownloadable from "../attachment/MessageAttachmentDownloadable";
import MessageAttachmentImage from "../attachment/MessageAttachmentImage";
import {downloadArrayBuffer, downloadBlob} from "../../../../util/browserUtils";
import {AlignSelfProperty, BorderRadiusProperty, ColorProperty, MarginTopProperty, OpacityProperty} from "csstype";
import ErrorRoundedIcon from "@material-ui/icons/ErrorRounded";
import MessageModifierTapbackRow from "../modifier/MessageModifierTapbackRow";
import MessageModifierStickerStack from "../modifier/MessageModifierStickerStack";
import {colorFromContact} from "../../../../util/avatarUtils";
import {Anchorme} from "react-anchorme";

const radiusLinked = "4px";
const radiusUnlinked = "16px";

const marginLinked = "2px";
const marginUnlinked = "8px";

const opacityUnconfirmed = 0.5;
const opacityConfirmed = 1;

//A message's position in the thread in accordance with other nearby messages
export interface MessageFlow {
	anchorTop: boolean;
	anchorBottom: boolean;
	showDivider: boolean;
}

export interface MessagePartProps {
	alignSelf: AlignSelfProperty; //Message alignment
	color: ColorProperty; //Text and action button colors
	backgroundColor: ColorProperty; //Message background color
	opacity: OpacityProperty; //Content opacity
	
	borderRadius: BorderRadiusProperty<string | 0>; //Content border radius
	marginTop: MarginTopProperty<string | 0>; //Message top margin
}

interface Props {
	message: Blocks.MessageItem;
	isGroupChat: boolean;
	flow: MessageFlow;
	showStatus?: boolean;
}

export default function Message(props: Props) {
	//State
	const [attachmentDataArray, setAttachmentDataArray] = useState<ArrayBuffer[]>([]);
	const [dialogOpen, setDialogOpen] = useState<"error" | "rawError" | undefined>(undefined);
	
	function closeDialog() {
		setDialogOpen(undefined);
	}
	function openDialogError() {
		setDialogOpen("error");
	}
	function openDialogRawError() {
		setDialogOpen("rawError");
	}
	function copyRawErrorAndClose() {
		navigator.clipboard.writeText(props.message.error!.detail!);
		closeDialog();
	}
	
	//Getting the message information
	const isOutgoing = props.message.sender === undefined;
	const displayAvatar = !isOutgoing && !props.flow.anchorTop;
	const displaySender = props.isGroupChat && displayAvatar;
	const messageConfirmed = props.message.status !== MessageStatusCode.Unconfirmed;
	
	//Building the message style
	const theme = useTheme();
	const messagePartPropsBase: Partial<MessagePartProps> = {
		alignSelf: isOutgoing ? "flex-end" : "flex-start",
		color: isOutgoing ? theme.palette.messageOutgoing.contrastText : theme.palette.messageIncoming.contrastText,
		backgroundColor: isOutgoing ? theme.palette.messageOutgoing.main : theme.palette.messageIncoming.main,
		opacity: messageConfirmed ? opacityConfirmed : opacityUnconfirmed
	}
	
	//Splitting the modifiers for each message part
	const stickerGroups = props.message.stickers.reduce((accumulator: {[index: number]: StickerItem[]}, item: StickerItem) => {
		if(accumulator[item.messageIndex]) accumulator[item.messageIndex].push(item);
		else accumulator[item.messageIndex] = [item];
		return accumulator;
	}, {});
	const tapbackGroups = props.message.tapbacks.reduce((accumulator: {[index: number]: TapbackItem[]}, item: TapbackItem) => {
		if(accumulator[item.messageIndex]) accumulator[item.messageIndex].push(item);
		else accumulator[item.messageIndex] = [item];
		return accumulator;
	}, {});
	
	//Adding the message text
	const components: React.ReactNode[] = [];
	if(props.message.text) {
		const partProps: MessagePartProps = {
			...messagePartPropsBase,
			borderRadius: getBorderRadius(props.flow.anchorTop, props.flow.anchorBottom || props.message.attachments.length > 0, isOutgoing),
			marginTop: 0
		} as MessagePartProps;
		
		const component = <MessageBubble key="messagetext" text={props.message.text!} index={0} partProps={partProps} stickers={stickerGroups[0]} tapbacks={tapbackGroups[0]} />;
		
		components.push(component);
	}
	
	function onAttachmentData(attachmentIndex: number, shouldDownload: boolean, data: ArrayBuffer) {
		if(shouldDownload) {
			//Downloading the file
			const attachment = props.message.attachments[attachmentIndex];
			downloadArrayBuffer(data, attachment.type, attachment.name);
		} else {
			//Updating the data
			const newArray = [...attachmentDataArray];
			newArray[attachmentIndex] = data;
			setAttachmentDataArray(newArray);
		}
	}
	
	function downloadData(attachmentIndex: number, data: ArrayBuffer | Blob) {
		const attachment = props.message.attachments[attachmentIndex];
		if(data instanceof ArrayBuffer) {
			downloadArrayBuffer(data, attachment.type, attachment.name);
		} else {
			downloadBlob(data, attachment.type, attachment.name);
		}
	}
	
	//Adding the attachments
	for(let i = 0; i < props.message.attachments.length; i++) {
		const index = props.message.text ? i + 1 : i;
		const attachment = props.message.attachments[i];
		
		const partProps: MessagePartProps = {
			...messagePartPropsBase,
			borderRadius: getBorderRadius(props.flow.anchorTop || index > 0, props.flow.anchorBottom || i + 1 < props.message.attachments.length, isOutgoing),
			marginTop: index > 0 ? marginLinked : undefined
		} as MessagePartProps;
		
		//Checking if the attachment has data
		const attachmentData = attachment.data ?? attachmentDataArray[i];
		if(attachmentData && isAttachmentPreviewable(attachment.type)) {
			//Custom background color
			const imagePartProps = {
				...partProps,
				backgroundColor: theme.palette.background.sidebar,
			};
			
			if(attachment.type.startsWith("image/")) {
				components.push(<MessageAttachmentImage key={attachment.guid ?? attachment.localID} data={attachmentData} name={attachment.name} type={attachment.type} partProps={imagePartProps} stickers={stickerGroups[index]} tapbacks={tapbackGroups[index]} />);
			}
		} else {
			//Adding a generic download attachment
			components.push(<MessageAttachmentDownloadable
				key={attachment.guid ?? attachment.localID}
				data={attachmentData}
				name={attachment.name}
				type={attachment.type}
				size={attachment.size}
				guid={attachment.guid!}
				onDataAvailable={(data) => onAttachmentData(i, !isAttachmentPreviewable(attachment.type), data)}
				onDataClicked={(data) => downloadData(i, data)}
				partProps={partProps}
				stickers={stickerGroups[index]}
				tapbacks={tapbackGroups[index]} />);
		}
	}
	
	const messageStyle: CSSProperties = {
		marginTop: props.flow.anchorTop ? marginLinked : marginUnlinked
	}
	
	//Initializing state
	const [contactData, setContactData] = useState<ContactData | undefined>();
	useEffect(() => {
		if(!props.message.sender) return;
		
		//Requesting contact data
		findPerson(props.message.sender).then((contact) => setContactData(contact), e => {console.error(e)});
	}, [props.message.sender]);
	
	//Building and returning the component
	return (
		<div className={styles.message} style={messageStyle}>
			{props.flow.showDivider && <Typography className={styles.separator} variant="body2" color="textSecondary">{getTimeDivider(props.message.date)}</Typography>}
			{displaySender && <Typography className={styles.labelSender} variant="caption" color="textSecondary">{contactData?.name ?? props.message.sender}</Typography>}
			<div className={styles.messageSplit}>
				{<Avatar className={styles.avatar} src={contactData?.avatar} style={displayAvatar ? {visibility: "visible", backgroundColor: colorFromContact(props.message.sender ?? "")} : {visibility: "hidden"}} />}
				<div className={styles.messageParts}>
					{components}
				</div>
				{props.message.progress && !props.message.error && <CircularProgress className={styles.messageProgress} size={24} variant={props.message.progress === -1 ? "indeterminate" : "determinate"} value={props.message.progress} />}
				{props.message.error && <IconButton className={styles.messageError} style={{color: theme.palette.error.main}} size="small" onClick={openDialogError}>
					<ErrorRoundedIcon />
				</IconButton>}
				<Dialog open={dialogOpen === "error"}
						onClose={closeDialog}>
					<DialogTitle>Your message could not be sent</DialogTitle>
					{props.message.error !== undefined && <React.Fragment>
						<DialogContent>
							<DialogContentText>{messageErrorToUserString(props.message.error!.code)}</DialogContentText>
						</DialogContent>
						<DialogActions>
							{props.message.error!.detail && <Button onClick={openDialogRawError} color="primary">
								Error details
							</Button>}
							<Button onClick={closeDialog} color="primary" autoFocus>
								Dismiss
							</Button>
						</DialogActions>
					</React.Fragment>}
				</Dialog>
				<Dialog open={dialogOpen === "rawError"}
						onClose={closeDialog}>
					<DialogTitle>Error details</DialogTitle>
					{props.message.error !== undefined && <React.Fragment>
						<DialogContent>
							<DialogContentText className={styles.rawErrorText}>{props.message.error.detail!}</DialogContentText>
						</DialogContent>
						<DialogActions>
							<Button onClick={copyRawErrorAndClose} color="primary">
								Copy to clipboard
							</Button>
							<Button onClick={closeDialog} color="primary" autoFocus>
								Dismiss
							</Button>
						</DialogActions>
					</React.Fragment>}
				</Dialog>
			</div>
			{props.showStatus && <Typography className={styles.labelStatus} variant="caption" color="textSecondary">{getStatusString(props.message)}</Typography>}
		</div>
	);
}

//A standard message bubble with text
function MessageBubble(props: {text: string, index: number, partProps: MessagePartProps, tapbacks?: TapbackItem[], stickers?: StickerItem[]}) {
	return (
		<DecorativeMessageBubble element="div" className={styles.textBubble} style={props.partProps} tapbacks={props.tapbacks} stickers={props.stickers}>
			<Anchorme target="_blank">{props.text}</Anchorme>
		</DecorativeMessageBubble>
	);
	
	/* return <div className={styles.textBubble + (props.tapbacks ? " " + styles.tapbackMargin : "")} style={props.partProps}>
		{props.stickers && <MessageModifierStickerStack modifiers={props.stickers} />}
		{props.tapbacks && <MessageModifierTapbackRow modifiers={props.tapbacks} />}
		{props.text}
	</div> */
}

export function DecorativeMessageBubble(props: {element: React.ElementType, className?: string, style?: React.CSSProperties, tapbacks?: TapbackItem[], stickers?: StickerItem[], children: React.ReactNode, [x: string]: any}) {
	const {className, style, tapbacks, stickers, children, ...rest} = props;
	
	const [isPeeking, setPeeking] = useState(false);
	
	function enablePeeking() {
		setPeeking(true);
	}
	
	function disablePeeking() {
		setPeeking(false);
	}
	
	return (
		<props.element className={(props.className ?? "") + (props.tapbacks ? " " + styles.tapbackMargin : "")} style={props.style} onMouseEnter={enablePeeking} onMouseLeave={disablePeeking} {...rest}>
			{props.stickers && <MessageModifierStickerStack modifiers={props.stickers} reveal={isPeeking} />}
			{props.tapbacks && <MessageModifierTapbackRow modifiers={props.tapbacks} />}
			{props.children}
		</props.element>
	);
}

function getBorderRadius(anchorTop: boolean, anchorBottom: boolean, isOutgoing: boolean): string {
	let radiusTop = anchorTop ? radiusLinked : radiusUnlinked;
	let radiusBottom = anchorBottom ? radiusLinked : radiusUnlinked;
	
	if(isOutgoing) {
		return `${radiusUnlinked} ${radiusTop} ${radiusBottom} ${radiusUnlinked}`;
	} else {
		return `${radiusTop} ${radiusUnlinked} ${radiusUnlinked} ${radiusBottom}`;
	}
}

function getStatusString(message: Blocks.MessageItem): string | undefined {
	if(message.status === MessageStatusCode.Delivered) {
		return "Delivered";
	} else if(message.status === MessageStatusCode.Read) {
		return message.statusDate ? "Read • " + getDeliveryStatusTime(message.statusDate) : "Read";
	} else {
		return undefined;
	}
}

function isAttachmentPreviewable(mimeType: string): boolean {
	//return mimeType.startsWith("image/") || mimeType.startsWith("video/") || mimeType.startsWith("audio/");
	return mimeType.startsWith("image/");
}

function messageErrorToUserString(error: MessageErrorCode): string {
	switch(error) {
		case MessageErrorCode.LocalInvalidContent:
			return "The selected content is unavailable";
		case MessageErrorCode.LocalTooLarge:
			return "The selected content is too large to send";
		case MessageErrorCode.LocalIO:
			return "Couldn't process selected content";
		case MessageErrorCode.LocalNetwork:
			return "Couldn't connect to AirMessage server";
		case MessageErrorCode.LocalInternalError:
			return "An internal error occurred";
		case MessageErrorCode.ServerUnknown:
			return "An unknown external error occurred";
		case MessageErrorCode.ServerExternal:
			return "An external error occurred";
		case MessageErrorCode.ServerBadRequest:
			return "An error occurred while sending this message";
		case MessageErrorCode.ServerUnauthorized:
			return "AirMessage server isn't allowed to send messages";
		case MessageErrorCode.ServerTimeout:
			return "This message couldn't be delivered properly";
		case MessageErrorCode.AppleNoConversation:
			return "This conversation isn't available";
		case MessageErrorCode.AppleNetwork:
			return "Couldn't connect to iMessage server";
		case MessageErrorCode.AppleUnregistered:
			return "This recipient is not registered with iMessage";
		default:
			return "An unknown error occurred";
	}
}