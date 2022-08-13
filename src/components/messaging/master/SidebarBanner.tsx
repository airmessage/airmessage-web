import React from "react";
import {Box, Button, Paper, Stack, Typography} from "@mui/material";

/**
 * A banner element that has an icon, a message,
 * and an optional button
 */
export default function SidebarBanner(props: {
	icon: React.ReactNode;
	message: string;
	button?: string;
	onClickButton?: VoidFunction;
	secondaryButton?: string;
	onClickSecondaryButton?: VoidFunction;
}) {
	return (
		<Paper
			sx={{
				display: "flex",
				flexDirection: "row",
				margin: 1,
				paddingX: 1,
				paddingTop: 2,
				paddingBottom: props.button ? 1 : 2
			}}
			variant="outlined">
			<Box marginLeft={1} marginRight={2}>
				{props.icon}
			</Box>
			
			<Stack
				flexGrow={1}
				gap={1}
				direction="column">
				<Typography display="inline">{props.message}</Typography>
				<Stack direction="row" gap={2} justifyContent="end">
					{props.secondaryButton !== undefined && (
						<Button
							color="primary"
							onClick={props.onClickSecondaryButton}>
							{props.secondaryButton}
						</Button>
					)}
					
					{props.button !== undefined && (
						<Button
							color="primary"
							variant={props.secondaryButton === undefined ? "text" : "contained"}
							onClick={props.onClickButton}>
							{props.button}
						</Button>
					)}
				</Stack>
			</Stack>
		</Paper>
	);
}