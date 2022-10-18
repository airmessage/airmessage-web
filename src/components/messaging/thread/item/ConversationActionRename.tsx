import React from "react";
import {ChatRenameAction} from "../../../../data/blocks";
import ConversationActionLine from "./ConversationActionLine";
import {usePersonName} from "shared/util/hookUtils";

export default function ConversationActionRename(props: {action: ChatRenameAction}) {
	const userName = usePersonName(props.action.user);
	
	return (
		<ConversationActionLine>
			{generateMessage(userName, props.action.chatName)}
		</ConversationActionLine>
	);
}

function generateMessage(user: string | undefined, title: string | undefined): string {
	if(user) {
		if(title) return `${user} named the conversation "${title}"`;
		else return `${user} removed the conversation name`;
	} else {
		if(title) return `You named the conversation "${title}"`;
		else return `You removed the conversation name`;
	}
}