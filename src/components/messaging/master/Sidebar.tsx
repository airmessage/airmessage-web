import React, {useCallback, useContext, useState} from "react";
import styles from "./Sidebar.module.css";

import AirMessageLogo from "../../logo/AirMessageLogo";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Menu,
	MenuItem,
	Toolbar,
	Typography,
	Skeleton, List
} from "@mui/material";

import ListConversation from "./ListConversation";
import {Conversation} from "../../../data/blocks";
import {Flipped, Flipper} from "react-flip-toolkit";
import ConnectionBanner from "./ConnectionBanner";
import {ConnectionErrorCode} from "../../../data/stateCodes";
import {communityPage, supportEmail} from "../../../data/linkConstants";
import {appVersion, getFormattedBuildDate, releaseHash} from "../../../data/releaseInfo";
import {
	getActiveCommVer,
	getActiveProxyType,
	getServerSoftwareVersion,
	getServerSystemVersion,
	targetCommVer
} from "../../../connection/connectionManager";
import Markdown from "../../Markdown";
import changelog from "../../../resources/text/changelog.md";
import LoginContext from "shared/components/LoginContext";
import {getPlatformUtils} from "shared/util/platformUtils";
import {AddRounded, MoreVertRounded} from "@mui/icons-material";
import {useBoolean, useCancellableEffect} from "shared/util/hookHelper";

export default function Sidebar(props: {
	conversations: Conversation[] | undefined;
	selectedConversation?: string;
	onConversationSelected: (guid: string) => void;
	onCreateSelected: () => void;
	errorBanner?: ConnectionErrorCode;
}) {
	const [overflowMenu, setOverflowMenu] = useState<HTMLElement | null>(null);
	const openOverflowMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
		setOverflowMenu(event.currentTarget);
	}, [setOverflowMenu]);
	const closeOverflowMenu = useCallback(() => {
		setOverflowMenu(null);
	}, [setOverflowMenu]);
	
	const [isChangelogDialog, showChangelogDialog, hideChangelogDialog] = useSidebarDialog(closeOverflowMenu);
	const [isFeedbackDialog, showFeedbackDialog, hideFeedbackDialog] = useSidebarDialog(closeOverflowMenu);
	const [isSignOutDialog, showSignOutDialog, hideSignOutDialog] = useSidebarDialog(closeOverflowMenu);
	
	return (
		<div className={styles.sidebar}>
			<ChangelogDialog isOpen={isChangelogDialog} onDismiss={hideChangelogDialog} />
			<FeedbackDialog isOpen={isFeedbackDialog} onDismiss={hideFeedbackDialog} />
			<SignOutDialog isOpen={isSignOutDialog} onDismiss={hideSignOutDialog} />
			
			<Toolbar className={styles.sidebarToolbar}>
				<AirMessageLogo />
				<div style={{flexGrow: 1}} />
				<IconButton
					size="large"
					onClick={props.onCreateSelected}
					disabled={props.conversations === undefined}>
					<AddRounded />
				</IconButton>
				<IconButton
					aria-haspopup="true"
					size="large"
					onClick={openOverflowMenu}
					disabled={props.conversations === undefined}>
					<MoreVertRounded />
				</IconButton>
				
				<Menu
					anchorEl={overflowMenu}
					anchorOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
					keepMounted
					transformOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
					open={!!overflowMenu}
					onClose={closeOverflowMenu}>
					<MenuItem onClick={showChangelogDialog}>What&apos;s new</MenuItem>
					<MenuItem onClick={showFeedbackDialog}>Help and feedback</MenuItem>
					<MenuItem onClick={showSignOutDialog}>Sign out</MenuItem>
				</Menu>
			</Toolbar>
			
			{props.errorBanner !== undefined && <ConnectionBanner error={props.errorBanner} /> }
			
			{props.conversations !== undefined ? (
				<Flipper
					className={styles.sidebarList}
					flipKey={props.conversations.map(conversation => conversation.guid).join(" ")}>
					<List>
						{props.conversations.map((conversation) =>
							<Flipped key={conversation.guid} flipId={conversation.guid}>
								{flippedProps => (
									<ListConversation
										conversation={conversation}
										selected={conversation.guid === props.selectedConversation}
										highlighted={conversation.unreadMessages}
										onSelected={() => props.onConversationSelected(conversation.guid)}
										flippedProps={flippedProps as Record<string, unknown>} />
								)}
							</Flipped>
						)}
					</List>
				</Flipper>
			) : (
				<div className={styles.sidebarListLoading}>
					{[...Array(16)].map((element, index) => <ConversationSkeleton key={`skeleton-${index}`} />)}
				</div>
			)}
		</div>
	);
}

function ChangelogDialog(props: {isOpen: boolean, onDismiss: () => void}) {
	//Generating the build details
	const buildDate = getFormattedBuildDate();
	const buildVersion = `AirMessage for web ${appVersion}`;
	const detailedBuildVersion = buildVersion + ` (${releaseHash ?? "unlinked"})`;
	const buildTitle = buildVersion + (buildDate ? (`, ${WPEnv.ENVIRONMENT === "production" ? "released" : "built"} ${buildDate}`) : "");
	
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onDismiss}
			fullWidth>
			<DialogTitle>Release notes</DialogTitle>
			<DialogContent dividers>
				<Typography variant="overline" color="textSecondary" gutterBottom title={detailedBuildVersion}>{buildTitle}</Typography>
				<Markdown markdown={changelog} />
			</DialogContent>
		</Dialog>
	);
}

function FeedbackDialog(props: {isOpen: boolean, onDismiss: () => void}) {
	const propsOnDismiss = props.onDismiss;
	
	const onClickEmail = useCallback(async () => {
		const body =
			`\n\n---------- DEVICE INFORMATION ----------` +
			Object.entries(await getPlatformUtils().getExtraEmailDetails())
				.map(([key, value]) => `\n${key}: ${value}`)
				.join("") +
			`\nUser agent: ${navigator.userAgent}` +
			`\nClient version: ${appVersion}` +
			`\nCommunications version: ${getActiveCommVer()} (target ${targetCommVer})` +
			`\nProxy type: ${getActiveProxyType()}` +
			`\nServer system version: ${getServerSystemVersion()}` +
			`\nServer software version: ${getServerSoftwareVersion()}`;
		const url = `mailto:${supportEmail}?subject=${encodeURIComponent("AirMessage feedback")}&body=${encodeURIComponent(body)}`;
		window.open(url, "_blank");
		propsOnDismiss();
	}, [propsOnDismiss]);
	
	const onClickCommunity = useCallback(() => {
		window.open(communityPage, "_blank");
		propsOnDismiss();
	}, [propsOnDismiss]);
	
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onDismiss}>
			<DialogTitle>Help and feedback</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Have a bug to report, a feature to suggest, or anything else to say? Contact us or discuss with others using the links below.
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClickEmail} color="primary">
					Send E-Mail
				</Button>
				<Button onClick={onClickCommunity} color="primary" autoFocus>
					Open community subreddit
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function SignOutDialog(props: {isOpen: boolean, onDismiss: () => void}) {
	const onDismiss = props.onDismiss;
	const signOut = useContext(LoginContext).signOut;
	const onConfirm = useCallback(() => {
		//Dismissing the dialog
		onDismiss();
		
		//Signing out
		signOut();
	}, [onDismiss, signOut]);
	
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onDismiss}>
			<DialogTitle>Sign out of AirMessage?</DialogTitle>
			<DialogContent>
				<DialogContentText>
					You won&apos;t be able to send or receive any messages from this computer
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onDismiss} color="primary">
					Cancel
				</Button>
				<Button onClick={onConfirm} color="primary" autoFocus>
					Sign out
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function ConversationSkeleton() {
	return (
		<div className={styles.skeletonMain}>
			<Skeleton variant="circular" width={40} height={40} animation={false} />
			<div className={styles.skeletonText}>
				<Skeleton variant="text" animation={false} />
				<Skeleton variant="text" animation={false} />
			</div>
		</div>
	);
}

/**
 * Creates a toggleable state for a sidebar dialog,
 * which also hides the menu on activation
 */
function useSidebarDialog(hideMenu: VoidFunction): [boolean, VoidFunction, VoidFunction] {
	const [showDialog, setShowDialog] = useState(false);
	
	const openDialog = useCallback(() => {
		hideMenu();
		setShowDialog(true);
	}, [hideMenu, setShowDialog]);
	const closeDialog = useCallback(() => {
		setShowDialog(false);
	}, [setShowDialog]);
	
	return [showDialog, openDialog, closeDialog];
}