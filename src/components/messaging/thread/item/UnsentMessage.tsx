import React from "react";
import {usePersonName} from "shared/util/hookUtils";
import ConversationActionLine from "shared/components/messaging/thread/item/ConversationActionLine";
import {MessageItem} from "shared/data/blocks";

export default function UnsentMessage(props: {
	message: MessageItem;
}) {
	const userName = usePersonName(props.message.sender);
	
	return (
		<ConversationActionLine>
			{generateMessage(userName)}
		</ConversationActionLine>
	);
}

function generateMessage(sender: string | undefined): string {
	if(sender === undefined) {
		return "You unsent a message";
	} else {
		return `${sender} unsent a message`;
	}
}
