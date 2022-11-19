import React from "react";
import Linkify from "linkify-react";
import MessageBubbleWrapper from "shared/components/messaging/thread/item/bubble/MessageBubbleWrapper";
import {StickerItem, TapbackItem} from "shared/data/blocks";
import {Stack, styled, Typography} from "@mui/material";
import {getBubbleSpacing, getFlowBorderRadius, MessagePartFlow} from "shared/util/messageFlow";

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
	history: string[];
	showHistory?: boolean;
	stickers: StickerItem[];
	tapbacks: TapbackItem[];
}) {
	const flowBorderRadius = getFlowBorderRadius(props.flow);
	
	return (
		<Stack
			width="100%"
			alignItems={props.flow.isOutgoing ? "end" : "start"}
			direction="column"
			gap={getBubbleSpacing(true)}>
			{props.showHistory && props.history.map((historyEntry, index) => (
				<MessageBubbleTypography
					key={historyEntry + index}
					sx={{opacity: 0.4}}
					color={props.flow.color}
					bgcolor={props.flow.backgroundColor}
					borderRadius={flowBorderRadius}
					variant="body2">
					<Linkify options={{target: "_blank"}}>{historyEntry}</Linkify>
				</MessageBubbleTypography>
			))}
			
			<MessageBubbleWrapper
				flow={props.flow}
				stickers={props.stickers}
				tapbacks={props.tapbacks}
				maxWidth="60%">
				<MessageBubbleTypography
					color={props.flow.color}
					bgcolor={props.flow.backgroundColor}
					borderRadius={flowBorderRadius}
					variant="body2">
					<Linkify options={{target: "_blank"}}>{props.text}</Linkify>
				</MessageBubbleTypography>
			</MessageBubbleWrapper>
		</Stack>
	);
}