import React, {useEffect, useState} from "react";
import styles from "./GroupAvatar.module.css";

import {Avatar} from "@mui/material";
import {findPerson} from "../../../util/peopleUtils";
import {colorFromContact} from "../../../util/avatarUtils";
import {PersonData} from "../../../../window";

export default function GroupAvatar(props: {members: string[]}) {
	const members = props.members;
	const [personArray, setPersonArray] = useState<(PersonData | undefined)[]>([]);
	
	useEffect(() => {
		//Reset the person array
		setPersonArray(new Array(members.length));
		
		//Fetching member names
		Promise.allSettled(members.map(findPerson)).then((resultArray) => {
			//Rebuilding the contact array
			const personArray: (PersonData | undefined)[] = [];
			for(let i = 0; i < resultArray.length; i++) {
				const result = resultArray[i];
				if(result.status === "fulfilled") personArray[i] = result.value;
				else personArray[i] = undefined;
			}
			
			//Updating the contact array
			setPersonArray(personArray);
		});
	}, [members]);
	
	let body: React.ReactNode[];
	if(members.length === 1) {
		body = [<PersonAvatar key={"1-" + members[0]} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />];
	} else if(members.length === 2) {
		body = [<PersonAvatar key={"1-" + members[0]} className={styles.avatar2first} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />,
			<PersonAvatar key={"2-" + members[1]} className={styles.avatar2second} person={personArray[1]} style={{backgroundColor: colorFromContact(members[1])}} />];
	} else if(members.length === 3) {
		body = [<PersonAvatar key={"1-" + members[0]} className={styles.avatar3first} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />,
			<PersonAvatar key={"2-" + members[1]} className={styles.avatar3second} person={personArray[1]} style={{backgroundColor: colorFromContact(members[1])}} />,
			<PersonAvatar key={"3-" + members[2]} className={styles.avatar3third} person={personArray[2]} style={{backgroundColor: colorFromContact(members[2])}} />];
	} else if(members.length === 0) {
		//Just in case?
		body = [<PersonAvatar key="default" />];
	} else {
		body = [<PersonAvatar key={"1-" + members[0]} className={styles.avatar4first} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />,
			<PersonAvatar key={"2-" + members[1]} className={styles.avatar4second} person={personArray[1]} style={{backgroundColor: colorFromContact(members[1])}} />,
			<PersonAvatar key={"3-" + members[2]} className={styles.avatar4third} person={personArray[2]} style={{backgroundColor: colorFromContact(members[2])}} />,
			<PersonAvatar key={"4-" + members[3]} className={styles.avatar4fourth} person={personArray[3]} style={{backgroundColor: colorFromContact(members[3])}} />];
	}
	
	return (
		<div className={styles.avatarContainer}>
			{body}
		</div>
	);
}

function PersonAvatar(props: {person?: PersonData, className?: string, style?: React.CSSProperties}) {
	return <Avatar alt={props.person?.name} src={props.person?.avatar} className={props.className} style={props.style} />;
}