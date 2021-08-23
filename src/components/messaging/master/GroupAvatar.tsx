import React, {useEffect, useState} from "react";
import styles from "./GroupAvatar.module.css";

import {Avatar} from "@material-ui/core";
import {findPerson} from "../../../util/peopleUtils";
import {colorFromContact} from "../../../util/avatarUtils";
import {PersonData} from "../../../../window";


export default function GroupAvatar(props: {members: string[]}) {
	const [personArray, setPersonArray] = useState<(PersonData | undefined)[]>(new Array(props.members.length));
	
	useEffect(() => {
		//Fetching member names
		Promise.allSettled(props.members.map(findPerson)).then((resultArray) => {
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
	}, [props.members]);
	
	let body: React.ReactNode[];
	if(personArray.length === 1) {
		body = [<PersonAvatar key={"1-" + props.members[0]} person={personArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />];
	} else if(personArray.length === 2) {
		body = [<PersonAvatar key={"1-" + props.members[0]} className={styles.avatar2first} person={personArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />,
			<PersonAvatar key={"2-" + props.members[1]} className={styles.avatar2second} person={personArray[1]} style={{backgroundColor: colorFromContact(props.members[1])}} />];
	} else if(personArray.length === 3) {
		body = [<PersonAvatar key={"1-" + props.members[0]} className={styles.avatar3first} person={personArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />,
			<PersonAvatar key={"2-" + props.members[1]} className={styles.avatar3second} person={personArray[1]} style={{backgroundColor: colorFromContact(props.members[1])}} />,
			<PersonAvatar key={"3-" + props.members[2]} className={styles.avatar3third} person={personArray[2]} style={{backgroundColor: colorFromContact(props.members[2])}} />];
	} else if(personArray.length === 0) {
		//Just in case?
		body = [<PersonAvatar key="default" />];
	} else {
		body = [<PersonAvatar key={"1-" + props.members[0]} className={styles.avatar4first} person={personArray[0]} style={{backgroundColor: colorFromContact(props.members[0])}} />,
			<PersonAvatar key={"2-" + props.members[1]} className={styles.avatar4second} person={personArray[1]} style={{backgroundColor: colorFromContact(props.members[1])}} />,
			<PersonAvatar key={"3-" + props.members[2]} className={styles.avatar4third} person={personArray[2]} style={{backgroundColor: colorFromContact(props.members[2])}} />,
			<PersonAvatar key={"4-" + props.members[3]} className={styles.avatar4fourth} person={personArray[3]} style={{backgroundColor: colorFromContact(props.members[3])}} />];
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