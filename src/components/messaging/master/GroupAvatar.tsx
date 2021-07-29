import React, {useEffect, useState} from "react";
import styles from "./GroupAvatar.module.css";

import {Avatar} from "@material-ui/core";
import {findPerson} from "../../../util/peopleUtils";
import {colorFromContact} from "../../../util/avatarUtils";
import {ContactData} from "../../../../window";

export default function GroupAvatar(props: {members: string[]}) {
	const [contactArray, setContactArray] = useState<ContactData[]>(new Array(props.members.length));
	
	useEffect(() => {
		//Duplicating the member array (in case any modifications are made to the conversation in the meantime)
		const memberArray = [...props.members];
		
		//Fetching member names
		Promise.allSettled(memberArray.map((member) => findPerson(member))).then((resultArray) => {
			//Rebuilding the contact array
			const contactArray: ContactData[] = [];
			for(let i = 0; i < resultArray.length; i++) {
				const result = resultArray[i];
				if(result.status === "fulfilled") contactArray[i] = result.value;
				else contactArray[i] = {};
			}
			
			//Updating the contact array
			setContactArray(contactArray);
		});
	}, [props.members]);
	
	let body: React.ReactNode[];
	if(contactArray.length === 1) {
		body = [<ContactAvatar key={"1-" + props.members[0]} contact={contactArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />];
	} else if(contactArray.length === 2) {
		body = [<ContactAvatar key={"1-" + props.members[0]} className={styles.avatar2first} contact={contactArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />,
			<ContactAvatar key={"2-" + props.members[1]} className={styles.avatar2second} contact={contactArray[1]} style={{backgroundColor: colorFromContact(props.members[1])}} />];
	} else if(contactArray.length === 3) {
		body = [<ContactAvatar key={"1-" + props.members[0]} className={styles.avatar3first} contact={contactArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />,
			<ContactAvatar key={"2-" + props.members[1]} className={styles.avatar3second} contact={contactArray[1]} style={{backgroundColor: colorFromContact(props.members[1])}} />,
			<ContactAvatar key={"2-" + props.members[2]} className={styles.avatar3third} contact={contactArray[2]} style={{backgroundColor: colorFromContact(props.members[2])}} />];
	} else if(contactArray.length === 0) {
		//Just in case?
		body = [<ContactAvatar key="default" />];
	} else {
		body = [<ContactAvatar key={"1-" + props.members[0]} className={styles.avatar4first} contact={contactArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />,
			<ContactAvatar key={"2-" + props.members[1]} className={styles.avatar4second} contact={contactArray[1]} style={{backgroundColor: colorFromContact(props.members[1])}} />,
			<ContactAvatar key={"3-" + props.members[2]} className={styles.avatar4third} contact={contactArray[2]} style={{backgroundColor: colorFromContact(props.members[2])}} />,
			<ContactAvatar key={"4-" + props.members[3]} className={styles.avatar4fourth} contact={contactArray[3]} style={{backgroundColor: colorFromContact(props.members[3])}} />];
	}
	
	return (
		<div className={styles.avatarContainer}>
			{body}
		</div>
	);
}

function ContactAvatar(props: {contact?: ContactData, className?: string, style?: React.CSSProperties}) {
	return <Avatar alt={props.contact?.name} src={props.contact?.avatar} className={props.className} style={props.style} />;
}