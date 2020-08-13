import React from "react";
import styles from "./Participants.module.css";

import {ContactData} from "../../../util/peopleUtils";
import {Typography} from "@material-ui/core";

interface Props {
	people: [string, ContactData][];
	onRemove: (person: string) => void;
}

export default function Participants(props: Props) {
	return (
		<div className={styles.root}>
		
		</div>
	);
}