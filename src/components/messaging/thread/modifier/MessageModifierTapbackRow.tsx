import React from "react";
import styles from "./MessageModifierTapbackRow.module.css";

import {TapbackItem} from "../../../../data/blocks";
import {TapbackType} from "../../../../data/stateCodes";
import {useTheme} from "@material-ui/core";
import TapbackLoveIcon from "../../../icon/TapbackLoveIcon";
import TapbackLikeIcon from "../../../icon/TapbackLikeIcon";
import TapbackDislikeIcon from "../../../icon/TapbackDislikeIcon";
import TapbackLaughIcon from "../../../icon/TapbackLaughIcon";
import TapbackEmphasisIcon from "../../../icon/TapbackEmphasisIcon";
import TapbackQuestionIcon from "../../../icon/TapbackQuestionIcon";

export default function MessageModifierTapbackRow(props: {modifiers: TapbackItem[]}) {
	//Counting tapbacks
	const counts = props.modifiers.reduce((accumulator: Map<TapbackType, number>, item: TapbackItem) => {
		const key = item.tapbackType;
		accumulator.set(key, accumulator.has(key) ? accumulator.get(key)! + 1 : 1);
		return accumulator;
	}, new Map());
	
	return (
		<div className={styles.tapbackGroup}>
			{Array.from(counts.entries()).map(([tapbackType, count]) => (
				<MessageModifierTapback key={tapbackType} type={tapbackType} count={count} />
			))}
		</div>
	);
}

function MessageModifierTapback(props: {type: TapbackType, count: number}) {
	const theme = useTheme();
	const iconColor = theme.palette.text.secondary;
	
	let icon: JSX.Element;
	switch(props.type) {
		case TapbackType.Love:
			icon = <TapbackLoveIcon className={styles.icon} style={{color: iconColor}} />;
			break;
		case TapbackType.Like:
			icon = <TapbackLikeIcon className={styles.icon} style={{color: iconColor}} />;
			break;
		case TapbackType.Dislike:
			icon = <TapbackDislikeIcon className={styles.icon} style={{color: iconColor}} />;
			break;
		case TapbackType.Laugh:
			icon = <TapbackLaughIcon className={styles.icon} style={{color: iconColor}} />;
			break;
		case TapbackType.Emphasis:
			icon = <TapbackEmphasisIcon className={styles.icon} style={{color: iconColor}} />;
			break;
		case TapbackType.Question:
			icon = <TapbackQuestionIcon className={styles.icon} style={{color: iconColor}} />;
			break;
	}
	
	return (
		<div className={styles.tapback} style={{backgroundColor: theme.palette.messageIncoming.main, borderColor: theme.palette.background.default}}>
			{icon}
			{props.count > 1 && <span className={styles.label} style={{color: iconColor}}>{props.count}</span>}
		</div>
	);
}