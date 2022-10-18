import React from "react";
import {ParticipantAction} from "../../../../data/blocks";
import {ParticipantActionType} from "../../../../data/stateCodes";
import ConversationActionLine from "./ConversationActionLine";
import {usePersonName} from "shared/util/hookUtils";

export default function ConversationActionParticipant(props: {action: ParticipantAction}) {
	const userName = usePersonName(props.action.user);
	const targetName = usePersonName(props.action.target);
	
	return (
		<ConversationActionLine>
			{generateMessage(props.action.type, userName, targetName)}
		</ConversationActionLine>
	);
}

function generateMessage(type: ParticipantActionType, user: string | undefined, target: string | undefined): string {
	if(type === ParticipantActionType.Join) {
		if(user === target) {
			if(user) return `${user} joined the conversation`;
			else return `You joined the conversation`;
		} else {
			if(user && target) return `${user} added ${target} to the conversation`;
			else if(user) return `${user} added you to the conversation`;
			else if(target) return `You added ${target} to the conversation`;
		}
	} else if(type === ParticipantActionType.Leave) {
		if(user === target) {
			if(user) return `${user} left the conversation`;
			else return `You left the conversation`;
		} else {
			if(user && target) return `${user} removed ${target} from the conversation`;
			else if(user) return `${user} removed you from the conversation`;
			else if(target) return `You removed ${target} from the conversation`;
		}
	}
	
	return "Unknown event";
}