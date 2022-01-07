import React from "react";
import styles from "./DetailFrame.module.css";

import {IconButton, Toolbar, Typography} from "@mui/material";
import SoftDivider from "../../SoftDivider";
import {VideocamOutlined} from "@mui/icons-material";

interface Props {
	title: string;
	children: React.ReactNode;
	className?: string;
	
	showCall?: boolean;
	onClickCall?: () => void;
}

export const DetailFrame = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
	return (
		<div className={styles.root} ref={ref}>
			<Toolbar>
				<Typography className={styles.title} variant="h6" noWrap>{props.title}</Typography>
				
				{props.showCall && (
					<IconButton
						size="large"
						onClick={props.onClickCall}>
						<VideocamOutlined />
					</IconButton>
				)}
			</Toolbar>
			<SoftDivider />
			{props.children}
		</div>
	);
});