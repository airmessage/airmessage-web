import React, {useCallback} from "react";
import {getPlatformUtils} from "shared/interface/platform/platformUtils";
import {appVersion} from "shared/data/releaseInfo";
import {
	getActiveCommVer,
	getActiveProxyType,
	getServerSoftwareVersion,
	getServerSystemVersion,
	targetCommVerString
} from "shared/connection/connectionManager";
import {discordAddress, redditAddress, supportEmail} from "shared/data/linkConstants";
import {Button, Dialog, DialogContent, DialogContentText, DialogTitle, Stack, ThemeProvider, createTheme} from "@mui/material";
import {Mail} from "@mui/icons-material";
import DiscordIcon from "shared/components/icon/DiscordIcon";
import RedditIcon from "shared/components/icon/RedditIcon";

const discordTheme = createTheme({ palette: { primary: { main: "#5865F2" } } });
const redditTheme = createTheme({ palette: { primary: { main: "#FF5700" } } });

/**
 * A dialog that presents help and feedback options
 */
export default function FeedbackDialog(props: {
	isOpen: boolean,
	onDismiss: () => void
}) {
	const onClickEmail = useCallback(async () => {
		const body =
			`\n\n---------- DEVICE INFORMATION ----------` +
			Object.entries(await getPlatformUtils().getExtraEmailDetails())
				.map(([key, value]) => `\n${key}: ${value}`)
				.join("") +
			`\nUser agent: ${navigator.userAgent}` +
			`\nClient version: ${appVersion}` +
			`\nCommunications version: ${getActiveCommVer()?.join(".")} (target ${targetCommVerString})` +
			`\nProxy type: ${getActiveProxyType()}` +
			`\nServer system version: ${getServerSystemVersion()}` +
			`\nServer software version: ${getServerSoftwareVersion()}`;
		const url = `mailto:${supportEmail}?subject=${encodeURIComponent("AirMessage feedback")}&body=${encodeURIComponent(body)}`;
		window.open(url, "_blank");
	}, []);
	
	const onClickDiscord = useCallback(() => {
		window.open(discordAddress, "_blank");
	}, []);
	
	const onClickReddit = useCallback(() => {
		window.open(redditAddress, "_blank");
	}, []);
	
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onDismiss}>
			<DialogTitle>Help and feedback</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Have a bug to report, a feature to suggest, or anything else to say? Contact us or discuss with others using the links below.
				</DialogContentText>
				
				<Stack
					marginTop={4}
					alignItems="center"
					spacing={2}>
					<Button variant="outlined"
							onClick={onClickEmail}
							startIcon={<Mail />}>
						Send E-Mail
					</Button>
					
					<ThemeProvider theme={discordTheme}>
						<Button
							variant="outlined"
							onClick={onClickDiscord}
							startIcon={<DiscordIcon />}>
							Join Discord server
						</Button>
					</ThemeProvider>
					
					<ThemeProvider theme={redditTheme}>
						<Button
							variant="outlined"
							onClick={onClickReddit}
							startIcon={<RedditIcon />}>
							Open community subreddit
						</Button>
					</ThemeProvider>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}