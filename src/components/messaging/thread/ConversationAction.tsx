import React from "react";
import {Typography} from "@material-ui/core";

interface Props {
	text: string;
}

export default function ConversationAction(props: Props) {
	return (
		<Typography variant="body1" color="textSecondary" gutterBottom style={{textAlign: "center"}}>{props.text}</Typography>
	);
}