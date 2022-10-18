import React, {useCallback, useContext, useEffect, useState} from "react";
import styles from "./Sidebar.module.css";
import AirMessageLogo from "../../logo/AirMessageLogo";
import {Box, Collapse, IconButton, List, Menu, MenuItem, Stack, Toolbar} from "@mui/material";
import ListConversation from "./ListConversation";
import {Conversation} from "../../../data/blocks";
import ConnectionBanner from "./ConnectionBanner";
import {ConnectionErrorCode, FaceTimeLinkErrorCode} from "../../../data/stateCodes";
import {
	AddRounded,
	Contacts,
	Feedback,
	MoreVertRounded,
	SyncProblem,
	Update,
	VideoCallOutlined
} from "@mui/icons-material";
import ChangelogDialog from "../dialog/ChangelogDialog";
import FeedbackDialog from "shared/components/messaging/dialog/FeedbackDialog";
import SignOutDialog from "shared/components/messaging/dialog/SignOutDialog";
import RemoteUpdateDialog from "shared/components/messaging/dialog/RemoteUpdateDialog";
import ServerUpdateData from "shared/data/serverUpdateData";
import * as ConnectionManager from "../../../connection/connectionManager";
import {RemoteUpdateListener} from "../../../connection/connectionManager";
import SidebarBanner from "shared/components/messaging/master/SidebarBanner";
import {SnackbarContext} from "shared/components/control/SnackbarProvider";
import FaceTimeLinkDialog from "shared/components/messaging/dialog/FaceTimeLinkDialog";
import {useIsFaceTimeSupported, useNonNullableCacheState} from "shared/util/hookUtils";
import UpdateRequiredDialog from "../dialog/UpdateRequiredDialog";
import ConversationSkeleton from "shared/components/skeleton/ConversationSkeleton";
import {TransitionGroup} from "react-transition-group";

const prKey = "22-08-pr-dismiss";

export default function Sidebar(props: {
	conversations: Conversation[] | undefined;
	selectedConversation?: number;
	onConversationSelected: (id: number) => void;
	onCreateSelected: () => void;
	errorBanner?: ConnectionErrorCode;
	needsServerUpdate?: boolean;
	needsPeoplePermission?: boolean;
	onRequestPeoplePermission?: () => void;
}) {
	const displaySnackbar = useContext(SnackbarContext);
	
	//The anchor element for the overflow menu
	const [overflowMenu, setOverflowMenu] = useState<HTMLElement | null>(null);
	useEffect(() => {
		//Don't hold dangling references to DOM elements
		return () => {
			setOverflowMenu(null);
		};
	}, [setOverflowMenu]);
	
	const openOverflowMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
		setOverflowMenu(event.currentTarget);
	}, [setOverflowMenu]);
	const closeOverflowMenu = useCallback(() => {
		setOverflowMenu(null);
	}, [setOverflowMenu]);
	
	const [isChangelogDialog, showChangelogDialog, hideChangelogDialog] = useSidebarDialog(closeOverflowMenu);
	const [isFeedbackDialog, showFeedbackDialog, hideFeedbackDialog] = useSidebarDialog(closeOverflowMenu);
	const [isSignOutDialog, showSignOutDialog, hideSignOutDialog] = useSidebarDialog(closeOverflowMenu);
	const [isRemoteUpdateDialog, showRemoteUpdateDialog, hideRemoteUpdateDialog] = useSidebarDialog();
	const [isUpdateRequiredDialog, showUpdateRequiredDialog, hideUpdateRequiredDialog] = useSidebarDialog();
	const [faceTimeLinkDialog, setFaceTimeLinkDialog] = useState<string | undefined>(undefined);
	
	const [showPRBanner, setShowPRBanner] = useState(() => !localStorage.getItem(prKey));
	const hidePRBanner = useCallback(() => {
		localStorage.setItem(prKey, "true");
		setShowPRBanner(false);
	}, [setShowPRBanner]);
	const launchPRLink = useCallback(() => {
		window.open("https://airmessage.org/free-imessage", "_blank");
	}, []);
	
	//Keep track of remote updates
	const [remoteUpdate, remoteUpdateCache, setRemoteUpdate] = useNonNullableCacheState<ServerUpdateData | undefined>(
		undefined,
		{id: 0, notes: "", protocolRequirement: [], remoteInstallable: false, version: ""}
	);
	useEffect(() => {
		const listener: RemoteUpdateListener = {onUpdate: setRemoteUpdate};
		ConnectionManager.addRemoteUpdateListener(listener);
		
		return () => {
			ConnectionManager.removeRemoteUpdateListener(listener);
			setRemoteUpdate(undefined);
		};
	}, [setRemoteUpdate]);
	
	//Keep track of whether FaceTime is supported
	const isFaceTimeSupported = useIsFaceTimeSupported();
	
	const [isFaceTimeLinkLoading, setFaceTimeLinkLoading] = useState(false);
	const createFaceTimeLink = useCallback(async () => {
		setFaceTimeLinkLoading(true);
		
		try {
			const link = await ConnectionManager.requestFaceTimeLink();
			
			//Prefer web share, fall back to displaying a dialog
			if(navigator.share) {
				await navigator.share({text: link});
			} else {
				setFaceTimeLinkDialog(link);
			}
		} catch(error) {
			if(error === FaceTimeLinkErrorCode.Network) {
				displaySnackbar({message: "Failed to get FaceTime link: no connection to server"});
			} else if(error === FaceTimeLinkErrorCode.External) {
				displaySnackbar({message: "Failed to get FaceTime link: an external error occurred"});
			}
		} finally {
			setFaceTimeLinkLoading(false);
		}
	}, [setFaceTimeLinkLoading, displaySnackbar]);
	
	return (
		<Stack height="100%">
			<ChangelogDialog isOpen={isChangelogDialog} onDismiss={hideChangelogDialog} />
			<FeedbackDialog isOpen={isFeedbackDialog} onDismiss={hideFeedbackDialog} />
			<SignOutDialog isOpen={isSignOutDialog} onDismiss={hideSignOutDialog} />
			<RemoteUpdateDialog isOpen={isRemoteUpdateDialog} onDismiss={hideRemoteUpdateDialog} update={remoteUpdateCache} />
			<UpdateRequiredDialog isOpen={isUpdateRequiredDialog} onDismiss={hideUpdateRequiredDialog} />
			<FaceTimeLinkDialog isOpen={faceTimeLinkDialog !== undefined} onDismiss={() => setFaceTimeLinkDialog(undefined)} link={faceTimeLinkDialog ?? ""} />
			
			<Toolbar>
				<AirMessageLogo />
				
				<Box sx={{flexGrow: 1}} />
				
				<Box sx={{display: "flex"}}>
					{isFaceTimeSupported && (
						<IconButton
							size="large"
							onClick={createFaceTimeLink}
							disabled={isFaceTimeLinkLoading}>
							<VideoCallOutlined />
						</IconButton>
					)}
					
					<IconButton
						size="large"
						onClick={props.onCreateSelected}
						disabled={props.conversations === undefined}>
						<AddRounded />
					</IconButton>
					
					<IconButton
						aria-haspopup="true"
						size="large"
						edge="end"
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
				</Box>
			</Toolbar>
			
			{showPRBanner && (
				<SidebarBanner
					icon={<Feedback />}
					message="Let's free iMessage - #FreeiMessage"
					button="Details"
					onClickButton={launchPRLink}
					secondaryButton="Dismiss"
					onClickSecondaryButton={hidePRBanner} />
			)}
			
			{props.errorBanner !== undefined && <ConnectionBanner error={props.errorBanner} /> }
			
			{props.needsPeoplePermission && (
				<SidebarBanner
					icon={<Contacts />}
					message="Allow access to contacts to show names and pictures"
					button="Enable"
					onClickButton={props.onRequestPeoplePermission} />
			)}
			
			{remoteUpdate !== undefined && (
				<SidebarBanner
					icon={<Update />}
					message="A server update is available"
					button="Details"
					onClickButton={showRemoteUpdateDialog} />
			)}
			
			{props.needsServerUpdate && (
				<SidebarBanner
					icon={<SyncProblem />}
					message="Your server needs to be updated"
					button="Details"
					onClickButton={showUpdateRequiredDialog} />
			)}
			
			{props.conversations !== undefined ? (
				<List className={styles.sidebarList}>
					<TransitionGroup>
						{props.conversations.map((conversation) => (
							<Collapse key={conversation.localID}>
								<ListConversation
									conversation={conversation}
									selected={conversation.localID === props.selectedConversation}
									highlighted={conversation.unreadMessages}
									onSelected={() => props.onConversationSelected(conversation.localID)} />
							</Collapse>
						))}
					</TransitionGroup>
				</List>
			) : (
				<Box className={styles.sidebarListLoading}>
					{[...Array(16)].map((element, index) => <ConversationSkeleton key={`skeleton-${index}`} />)}
				</Box>
			)}
		</Stack>
	);
}

/**
 * Creates a toggleable state for a sidebar dialog
 * @param openCallback A callback invoked when the menu is opened
 */
function useSidebarDialog(openCallback?: VoidFunction): [boolean, VoidFunction, VoidFunction] {
	const [showDialog, setShowDialog] = useState(false);
	
	const openDialog = useCallback(() => {
		openCallback?.();
		setShowDialog(true);
	}, [openCallback, setShowDialog]);
	const closeDialog = useCallback(() => {
		setShowDialog(false);
	}, [setShowDialog]);
	
	useEffect(() => {
		//Close the dialog on unmount
		return () => {
			setShowDialog(false);
		};
	}, [setShowDialog]);
	
	return [showDialog, openDialog, closeDialog];
}