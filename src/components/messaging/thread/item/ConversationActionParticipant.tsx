import React, {useEffect, useState} from "react";
import {ParticipantAction} from "../../../../data/blocks";
import {ParticipantActionType} from "../../../../data/stateCodes";
import {findPerson} from "../../../../util/peopleUtils";
import ConversationActionLine from "./ConversationActionLine";

export default function ConversationActionParticipant(props: {action: ParticipantAction}) {
	const [userName, setUserName] = useState<string | undefined>(props.action.user);
	const [targetName, setTargetName] = useState<string | undefined>(props.action.target);
	
	useEffect(() => {
		//Filling in the values with the defaults
		setUserName(props.action.user);
		setTargetName(props.action.target);
		
		//Loading the user data
		if(props.action.user) {
			findPerson(props.action.user).then((name) => {
				if(name.name && userName === props.action.user) setUserName(name.name);
			});
		}
		if(props.action.target) {
			findPerson(props.action.target).then((name) => {
				if(name.name && targetName === props.action.target) setTargetName(name.name);
			});
		}
	}, [props.action]);
	
	return <ConversationActionLine message={generateMessage(props.action.type, userName, targetName)} />
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