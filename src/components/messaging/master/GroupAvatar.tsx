import React, {useContext, useMemo} from "react";
import styles from "./GroupAvatar.module.css";

import {Avatar, Box} from "@mui/material";
import {PersonData} from "../../../interface/people/peopleUtils";
import {colorFromContact} from "../../../util/avatarUtils";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles";
import {PeopleContext} from "shared/state/peopleState";

export default function GroupAvatar(props: {members: string[]}) {
	const members = props.members;
	const peopleState = useContext(PeopleContext);
	const personArray = useMemo(
		() => members.map((address) => peopleState.getPerson(address)),
		[members, peopleState]
	);
	
	let body: React.ReactNode[];
	switch(members.length) {
		case 0:
			body = [
				<PersonAvatar key="default" />
			];
			break;
		case 1:
			body = [
				<PersonAvatar key={"1-" + members[0]} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />
			];
			break;
		case 2:
			body = [
				<PersonAvatar key={"1-" + members[0]} className={styles.avatar2first} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />,
				<PersonAvatar key={"2-" + members[1]} className={styles.avatar2second} person={personArray[1]} style={{backgroundColor: colorFromContact(members[1])}} />
			];
			break;
		case 3:
			body = [
				<PersonAvatar key={"1-" + members[0]} className={styles.avatar3first} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />,
				<PersonAvatar key={"2-" + members[1]} className={styles.avatar3second} person={personArray[1]} style={{backgroundColor: colorFromContact(members[1])}} />,
				<PersonAvatar key={"3-" + members[2]} className={styles.avatar3third} person={personArray[2]} style={{backgroundColor: colorFromContact(members[2])}} />
			];
			break;
		case 4:
		default:
			body = [
				<PersonAvatar key={"1-" + members[0]} className={styles.avatar4first} person={personArray[0]} style={{backgroundColor: colorFromContact(members[0])}} />,
				<PersonAvatar key={"2-" + members[1]} className={styles.avatar4second} person={personArray[1]} style={{backgroundColor: colorFromContact(members[1])}} />,
				<PersonAvatar key={"3-" + members[2]} className={styles.avatar4third} person={personArray[2]} style={{backgroundColor: colorFromContact(members[2])}} />,
				<PersonAvatar key={"4-" + members[3]} className={styles.avatar4fourth} person={personArray[3]} style={{backgroundColor: colorFromContact(members[3])}} />
			];
	}
	
	return (
		<Box className={styles.avatarContainer}>
			{body}
		</Box>
	);
}

function PersonAvatar(props: {
	person?: PersonData,
	sx?: SxProps<Theme>,
	style?: React.CSSProperties,
	className?: string
}) {
	return <Avatar
		sx={props.sx}
		style={props.style}
		className={props.className}
		alt={props.person?.name}
		src={props.person?.avatar} />;
}