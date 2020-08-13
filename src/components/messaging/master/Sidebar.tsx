import React from "react";
import styles from './Sidebar.module.css';

import * as firebase from "firebase/app";
import "firebase/auth";

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
	Toolbar
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

interface Props {
	conversations: Conversation[] | undefined;
	selectedConversation?: string;
	onConversationSelected: (guid: string) => void;
	onCreateSelected: () => void;
	errorBanner?: ConnectionErrorCode;
}

interface State {
	overflowMenuElement: HTMLElement | null;
	showLogOutDialog: boolean;
}

export default class Sidebar extends React.Component<Props, State> {
	state = {
		overflowMenuElement: null,
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
	
	private readonly handleOverflowLogOut = () => {
		//Closing the menu
		this.handleOverflowClose();
		
		//Prompting the user to log out
		this.setState({
			showLogOutDialog: true
		})
	}
	
	private readonly dismissLogOut = () => {
		this.setState({
			showLogOutDialog: false
		})
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
				<SignOutAlert isOpen={this.state.showLogOutDialog} onConfirm={this.confirmLogOut} onDismiss={this.dismissLogOut} />
				
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
						{/*<MenuItem onClick={this.handleOverflowClose}>App info</MenuItem>*/}
						{/*<MenuItem onClick={this.handleOverflowClose}>Send feedback</MenuItem>*/}
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

function SignOutAlert(props: {isOpen: boolean, onConfirm: () => void, onDismiss: () => void}) {
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
				<Button onClick={props.onConfirm} color="primary" autoFocus>
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