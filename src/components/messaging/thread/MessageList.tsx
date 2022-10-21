import React from "react";
import {Box, CircularProgress, Stack} from "@mui/material";
import Message from "./item/Message";
import {getMessageFlow} from "../../../util/conversationUtils";
import {Conversation, ConversationItem} from "../../../data/blocks";
import {ConversationItemType, MessageStatusCode} from "../../../data/stateCodes";
import EventEmitter from "../../../util/eventEmitter";
import ConversationActionParticipant from "./item/ConversationActionParticipant";
import ConversationActionRename from "./item/ConversationActionRename";

interface Props {
	conversation: Conversation;
	items: ConversationItem[];
	messageSubmitEmitter: EventEmitter<void>;
	onRequestHistory: () => void;
	showHistoryLoader?: boolean;
}

interface State {
	isInThreshold: boolean;
}

const historyLoadScrollThreshold = 300;

export default class MessageList extends React.Component<Props, State> {
	state = {
		isInThreshold: false
	};
	
	//Reference to the message scroll list element
	private readonly scrollRef = React.createRef<HTMLDivElement>();
	
	//Receiver controller for children to adjust scrolling
	private readonly scrollReceiver = new EventEmitter<void>();
	
	//List scroll position snapshot values
	private snapshotScrollHeight = 0;
	private snapshotScrollTop = 0;
	
	//Used to track whether the message list should be scrolled to the bottom when the component is next updated
	private shouldScrollNextUpdate = false;
	
	private readonly handleScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
		if(event.currentTarget.scrollTop < historyLoadScrollThreshold) {
			if(!this.state.isInThreshold) {
				this.setState({isInThreshold: true});
				this.props.onRequestHistory();
			}
		} else {
			if(this.state.isInThreshold) {
				this.setState({isInThreshold: false});
			}
		}
	};
	
	render() {
		//The latest outgoing item with the "read" status
		const readTargetIndex = this.props.items.findIndex((item) =>
			item.itemType === ConversationItemType.Message
			&& item.sender === undefined
			&& item.status === MessageStatusCode.Read);
		
		//The latest outgoing item with the "delivered" status, no further than the latest item with the "read" status
		const deliveredTargetIndex = this.props.items
			.slice(0, readTargetIndex === -1 ? undefined : readTargetIndex)
			.findIndex((item) =>
				item.itemType === ConversationItemType.Message
				&& item.sender === undefined
				&& item.status === MessageStatusCode.Delivered);
		
		return (
			<Box sx={{
				width: "100%",
				flexGrow: 1,
				minHeight: 0,
				
				padding: 2,
				overflowX: "hidden",
				overflowY: "scroll",
				scrollBehavior: "smooth"
			}} ref={this.scrollRef} onScroll={this.handleScroll}>
				<Stack sx={{
					width: "100%",
					maxWidth: "1000px",
					marginX: "auto"
				}} direction="column-reverse">
					{this.props.items.map((item, i, array) => {
						if(item.itemType === ConversationItemType.Message) {
							return (
								<Message
									key={(item.localID ?? item.guid)}
									message={item}
									isGroupChat={this.props.conversation.members.length > 1}
									service={this.props.conversation.service}
									flow={getMessageFlow(item, array[i + 1], array[i - 1])}
									showStatus={i === readTargetIndex || i === deliveredTargetIndex}
									scrollAdjustEmitter={this.scrollReceiver} />
							);
						} else if(item.itemType === ConversationItemType.ParticipantAction) {
							return (
								<ConversationActionParticipant
									key={(item.localID ?? item.guid)}
									action={item} />
							);
						} else if(item.itemType === ConversationItemType.ChatRenameAction) {
							return (
								<ConversationActionRename
									key={(item.localID ?? item.guid)}
									action={item} />
							);
						} else {
							return null;
						}
					})}
					
					{this.props.showHistoryLoader && <HistoryLoadingProgress key="static-historyloader" />}
				</Stack>
			</Box>
		);
	}
	
	componentDidMount() {
		//Registering the submit listener
		this.props.messageSubmitEmitter.subscribe(this.onMessageSubmit);
		
		//Registering the scroll update receiver
		this.scrollReceiver.subscribe(this.onAdjustScroll);
		
		//Scrolling to the bottom of the list
		this.scrollToBottom(true);
	}
	
	getSnapshotBeforeUpdate() {
		this.shouldScrollNextUpdate = this.checkScrolledToBottom();
		
		const element = this.scrollRef.current!;
		this.snapshotScrollHeight = element.scrollHeight;
		this.snapshotScrollTop = element.scrollTop;
		
		return null;
	}
	
	componentDidUpdate(prevProps: Readonly<Props>) {
		//Scrolling the list to the bottom if needed
		if(this.shouldScrollNextUpdate) {
			this.scrollToBottom();
			this.shouldScrollNextUpdate = false;
		}
		//Restoring the scroll position when new items are added at the top
		else if(this.props.showHistoryLoader !== prevProps.showHistoryLoader && this.checkScrolledToTop()) {
			const element = this.scrollRef.current!;
			this.setScroll(this.snapshotScrollTop + (element.scrollHeight - this.snapshotScrollHeight), true);
		}
		
		//Updating the submit emitter
		if(this.props.messageSubmitEmitter !== prevProps.messageSubmitEmitter) {
			prevProps.messageSubmitEmitter.unsubscribe(this.onMessageSubmit);
			this.props.messageSubmitEmitter.subscribe(this.onMessageSubmit);
		}
	}
	
	componentWillUnmount() {
		//Unregistering the submit listener
		this.props.messageSubmitEmitter.unsubscribe(this.onMessageSubmit);
		
		//Unregistering the scroll update receiver
		this.scrollReceiver.unsubscribe(this.onAdjustScroll);
	}
	
	private readonly onMessageSubmit = () => {
		setTimeout(() => this.scrollToBottom(), 0);
	};
	
	private readonly onAdjustScroll = () => {
		//Keep the list scrolled to the bottom
		if(this.checkScrolledToBottom()) {
			setTimeout(() => {
				this.scrollToBottom(true);
			});
		}
	};
	
	private scrollToBottom(disableAnimation: boolean = false): void {
		this.setScroll(this.scrollRef.current!.scrollHeight, disableAnimation);
	}
	
	private setScroll(scrollTop: number, disableAnimation: boolean = false) {
		const element = this.scrollRef.current!;
		if(disableAnimation) element.style.scrollBehavior = "auto";
		element.scrollTop = scrollTop;
		if(disableAnimation) element.style.scrollBehavior = "";
	}
	
	private checkScrolledToBottom(): boolean {
		const element = this.scrollRef.current!;
		return element.scrollHeight - element.scrollTop - element.clientHeight <= 0;
	}
	
	private checkScrolledToTop(): boolean {
		const element = this.scrollRef.current!;
		return element.scrollTop <= 0;
	}
}

function HistoryLoadingProgress() {
	return (
		<Box sx={{
			display: "flex",
			alignItems: "center",
			justifyContent: "center"
		}}>
			<CircularProgress />
		</Box>
	);
}