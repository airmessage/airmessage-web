import React, {useEffect, useState} from "react";
import {ChatRenameAction} from "../../../../data/blocks";
import {findPerson} from "../../../../util/peopleUtils";
import ConversationActionLine from "./ConversationActionLine";

export default function ConversationActionRename(props: {action: ChatRenameAction}) {
	const [userName, setUserName] = useState<string | undefined>(props.action.user);
	
	useEffect(() => {
		//Filling in the values with the defaults
		setUserName(props.action.user);
		
		//Loading the user data
		if(props.action.user) {
			findPerson(props.action.user).then((name) => {
				if(name.name && userName === props.action.user) setUserName(name.name);
			});
		}
	}, [props.action.user]);
	
	return <ConversationActionLine message={generateMessage(userName, props.action.chatName)} />
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