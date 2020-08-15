import React, {useEffect, useState} from "react";
import styles from './Sidebar.module.css';

import firebase from "firebase/app";
import "firebase/auth";

import AirMessageLogo from "../../logo/AirMessageLogo";
import {
	Button, CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Menu,
	MenuItem,
	Toolbar, Typography
} from "@material-ui/core";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import MoreVertRoundedIcon from "@material-ui/icons/MoreVertRounded";

import ListConversation from "./ListConversation";
import List from "@material-ui/core/List";
import {Conversation} from "../../../data/blocks";
import {Flipped, Flipper} from "react-flip-toolkit";
import {Skeleton} from "@material-ui/lab";
import ConnectionBanner from "./ConnectionBanner";
import {ConnectionErrorCode} from "../../../data/stateCodes";
import {communityPage, supportEmail} from "../../../data/linkConstants";
import {appVersion, getAppVersionReleaseString} from "../../../data/releaseInfo";
import {
	getActiveCommVer,
	getServerSoftwareVersion,
	getServerSystemVersion,
	targetCommVer
} from "../../../connection/connectionManager";
import Markdown from "../../Markdown";

interface Props {
	conversations: Conversation[] | undefined;
	selectedConversation?: string;
	onConversationSelected: (guid: string) => void;
	onCreateSelected: () => void;
	errorBanner?: ConnectionErrorCode;
}

interface State {
	overflowMenuElement: HTMLElement | null;
	showChangelogDialog: boolean;
	showFeedbackDialog: boolean;
	showLogOutDialog: boolean;
}

export default class Sidebar extends React.Component<Props, State> {
	state = {
		overflowMenuElement: null,
		showChangelogDialog: false,
		showFeedbackDialog: false,
		showLogOutDialog: false
	}
	
	intervalID: any;
	
	private readonly handleOverflowOpen = (event: React.MouseEvent<HTMLElement>) => {
		this.setState({
			overflowMenuElement: event.currentTarget
		})
	}
	
	private readonly handleOverflowClose = () => {
		this.setState({
			overflowMenuElement: null
		})
	}
	
	private readonly handleOverflowChangelog = () => {
		//Closing the menu
		this.handleOverflowClose();
		
		//Showing the changelog dialog
		this.setState({showChangelogDialog: true});
	}
	
	private readonly dismissOverflowChangelog = () => {
		this.setState({showChangelogDialog: false});
	}
	
	private readonly handleOverflowFeedback = () => {
		//Closing the menu
		this.handleOverflowClose();
		
		//Showing the feedback dialog
		this.setState({showFeedbackDialog: true});
	};
	
	private readonly dismissOverflowFeedback = () => {
		this.setState({showFeedbackDialog: false});
	}
	
	private readonly handleOverflowLogOut = () => {
		//Closing the menu
		this.handleOverflowClose();
		
		//Prompting the user to log out
		this.setState({showLogOutDialog: true});
	}
	
	private readonly dismissLogOut = () => {
		this.setState({showLogOutDialog: false});
	}
	
	private readonly confirmLogOut = () => {
		//Dismissing the log out dialog
		this.dismissLogOut();
		
		//Logging out
		firebase.auth().signOut();
	}
	
	render() {
		return (
			<div className={styles.sidebar}>
				<ChangelogDialog isOpen={this.state.showChangelogDialog} onDismiss={this.dismissOverflowChangelog} />
				<FeedbackDialog isOpen={this.state.showFeedbackDialog} onDismiss={this.dismissOverflowFeedback} />
				<SignOutDialog isOpen={this.state.showLogOutDialog} onDismiss={this.dismissLogOut} />
				
				<Toolbar className={styles.sidebarToolbar}>
					<AirMessageLogo />
					<div style={{flexGrow: 1}} />
					<IconButton
						color="inherit"
						onClick={this.props.onCreateSelected}
						disabled={!this.props.conversations}>
						<AddRoundedIcon />
					</IconButton>
					<IconButton
						aria-haspopup="true"
						color="inherit"
						onClick={this.handleOverflowOpen}
						disabled={!this.props.conversations}>
						<MoreVertRoundedIcon />
					</IconButton>
					
					<Menu
						anchorEl={this.state.overflowMenuElement}
						anchorOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						keepMounted
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						open={Boolean(this.state.overflowMenuElement)}
						onClose={this.handleOverflowClose}>
						{/*<MenuItem onClick={this.handleOverflowClose}>Settings</MenuItem>*/}
						<MenuItem onClick={this.handleOverflowChangelog}>What's new</MenuItem>
						<MenuItem onClick={this.handleOverflowFeedback}>Help and feedback</MenuItem>
						<MenuItem onClick={this.handleOverflowLogOut}>Sign out</MenuItem>
					</Menu>
				</Toolbar>
				
				{this.props.errorBanner && <ConnectionBanner error={this.props.errorBanner} /> }
				
				{
					this.props.conversations ? <Flipper flipKey={this.props.conversations.map(conversation => conversation.guid).join(" ")} className={styles.sidebarList}>
						<List>
							{this.props.conversations.map((conversation) =>
								<Flipped key={conversation.guid} flipId={conversation.guid}>
									{flippedProps => <ListConversation conversation={conversation} selected={conversation.guid === this.props.selectedConversation} highlighted={conversation.unreadMessages} onSelected={() => this.props.onConversationSelected(conversation.guid)} flippedProps={flippedProps} />}
								</Flipped>
							)}
						</List>
					</Flipper> : <div className={styles.sidebarListLoading}>
						{[...Array(16)].map((element, index) => <ConversationSkeleton key={`skeleton-${index}`} />)}
					</div>
				}
			</div>
		);
	}
	
	componentDidMount() {
		this.intervalID = setInterval(() => this.setState({}), 60 * 1000);
	}
	
	componentWillUnmount() {
		clearInterval(this.intervalID);
	}
}

function ChangelogDialog(props: {isOpen: boolean, onDismiss: () => void}) {
	const [changelog, setChangelog] = useState<string | undefined>();
	
	//Loading the changelog
	useEffect(() => {
		const xhr = new XMLHttpRequest();
		xhr.responseType = "text";
		xhr.open("GET", "/data/changes.md");
		xhr.send();
		xhr.onload = () => {
			if(xhr.status !== 200) return;
			setChangelog(xhr.responseText);
		};
	}, []);
	
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onDismiss}
			fullWidth>
			<DialogTitle>Release notes</DialogTitle>
			<DialogContent dividers>
				{
					changelog === undefined ?
						<CircularProgress /> :
						<React.Fragment>
							<Typography variant="overline" color="textSecondary" gutterBottom>{`AirMessage for web ${appVersion}, released ${getAppVersionReleaseString()}`}</Typography>
							<Markdown markdown={changelog} />
						</React.Fragment>
				}
			</DialogContent>
		</Dialog>
	);
}

function FeedbackDialog(props: {isOpen: boolean, onDismiss: () => void}) {
	function onClickEmail() {
		const url = `mailto:${supportEmail}?subject=${encodeURIComponent("AirMessage feedback")}&body=${encodeURIComponent(
			`\n\n---------- DEVICE INFORMATION ----------
			User agent: ${navigator.userAgent}
			Client version: ${appVersion}
			Current protocol version: ${getActiveCommVer()}
			Target protocol version: ${targetCommVer}
			Server system version: ${getServerSystemVersion()}
			Server software version: ${getServerSoftwareVersion()}`)}`
		window.open(url, "_blank");
		props.onDismiss();
	}
	
	function onClickCommunity() {
		window.open(communityPage, "_blank");
		props.onDismiss();
	}
	
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
	function onConfirm() {
		//Dismissing the dialog
		props.onDismiss();
		
		//Logging out
		firebase.auth().signOut();
	}
	
	return (
		<Dialog
			open={props.isOpen}
			onClose={props.onDismiss}>
			<DialogTitle>Sign out of AirMessage?</DialogTitle>
			<DialogContent>
				<DialogContentText>
					You won't be able to send or receive any messages from this computer
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
			<Skeleton variant="circle" width={40} height={40} animation={false} />
			<div className={styles.skeletonText}>
				<Skeleton variant="text" animation={false} />
				<Skeleton variant="text" animation={false} />
			</div>
		</div>
	)
}