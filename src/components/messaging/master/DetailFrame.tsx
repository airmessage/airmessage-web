import React from "react";
import styles from "./DetailFrame.module.css";

import {Toolbar, Typography} from "@material-ui/core";
import SoftDivider from "../../SoftDivider";

interface Props {
	title: string;
	children: React.ReactNode;
	className?: string;
}

export const DetailFrame = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
	return (
		<div className={styles.root} ref={ref}>
			<Toolbar>
				<Typography className={styles.title} variant="h6" noWrap>{props.title}</Typography>
			</Toolbar>
			<SoftDivider />
			{props.children}
		</div>
	);
});