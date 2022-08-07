import React from "react";
import Linkify from "linkify-react";
import MessageBubbleWrapper from "shared/components/messaging/thread/item/bubble/MessageBubbleWrapper";
import {StickerItem, TapbackItem} from "shared/data/blocks";
import {styled, Typography} from "@mui/material";
import {getFlowBorderRadius, MessagePartFlow} from "shared/util/messageFlow";

const MessageBubbleTypography = styled(Typography)(({theme}) => ({
	paddingLeft: theme.spacing(1.5),
	paddingRight: theme.spacing(1.5),
	paddingTop: theme.spacing(0.75),
	paddingBottom: theme.spacing(0.75),
	overflowWrap: "break-word",
	wordBreak: "break-word",
	hyphens: "auto",
	whiteSpace: "break-spaces",
	
	"& a": {
		color: "inherit"
	}
}));

/**
 * A message bubble that displays text content
 */
export default function MessageBubbleText(props: {
	flow: MessagePartFlow;
	text: string;
	stickers: StickerItem[];
	tapbacks: TapbackItem[];
}) {
	return (
		<MessageBubbleWrapper
			flow={props.flow}
			stickers={props.stickers}
			tapbacks={props.tapbacks}
			maxWidth="60%">
			<MessageBubbleTypography
				color={props.flow.color}
				bgcolor={props.flow.backgroundColor}
				borderRadius={getFlowBorderRadius(props.flow)}
				variant="body2">
				<Linkify options={{target: "_blank"}}>{props.text}</Linkify>
			</MessageBubbleTypography>
		</MessageBubbleWrapper>
	);
}