import React from "react";
import styles from "./MessageList.module.css";

import Message from "./item/Message";
import * as ConversationUtils from "../../../util/conversationUtils";
import {Conversation, ConversationItem} from "../../../data/blocks";
import {getMessageFlow} from "../../../util/conversationUtils";
import {MessageStatusCode} from "../../../data/stateCodes";
import EventEmitter from "../../../util/eventEmitter";
import ConversationActionParticipant from "./item/ConversationActionParticipant";
import ConversationActionRename from "./item/ConversationActionRename";
import {CircularProgress} from "@material-ui/core";

interface Props {
	conversation: Conversation;
	items: ConversationItem[];
	messageSubmitEmitter: EventEmitter<any>;
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
	readonly scrollRef = React.createRef<HTMLDivElement>();
	
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
	}
	
	render() {
		//The latest outgoing item with the "read" status
		const readTargetIndex = this.props.items.findIndex((item) => ConversationUtils.isConversationItemMessage(item) && !item.sender && item.status === MessageStatusCode.Read);
		//The latest outgoing item with the "delivered" status, no further than the latest item with the "read" status
		const deliveredTargetIndex = this.props.items.slice(0, readTargetIndex !== -1 ? readTargetIndex : undefined).findIndex((item) => ConversationUtils.isConversationItemMessage(item) && !item.sender && item.status === MessageStatusCode.Delivered);
		
		return (
			<div className={styles.scroll} ref={this.scrollRef} onScroll={this.handleScroll}>
				<div className={styles.list}>
					{this.props.items.map((item, i, array) => {
						if(ConversationUtils.isConversationItemMessage(item)) {
							return <Message key={(item.localID ?? item.guid)} message={item} isGroupChat={this.props.conversation.members.length > 1} service={this.props.conversation.service} flow={getMessageFlow(item, array[i + 1], array[i - 1])} showStatus={i === readTargetIndex || i === deliveredTargetIndex} />;
						} else if(ConversationUtils.isConversationItemParticipantAction(item)) {
							return <ConversationActionParticipant key={(item.localID ?? item.guid)} action={item} />;
						} else if(ConversationUtils.isConversationItemChatRenameAction(item)) {
							return <ConversationActionRename key={(item.localID ?? item.guid)} action={item} />;
						} else {
							return null;
						}
					})}
					{this.props.showHistoryLoader && <HistoryLoadingProgress key="static-historyloader" />}
				</div>
			</div>
		);
	}
	
	componentDidMount() {
		//Registering the submit listener
		this.props.messageSubmitEmitter.registerListener(this.onMessageSubmit);
		
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
			prevProps.messageSubmitEmitter.unregisterListener(this.onMessageSubmit);
			this.props.messageSubmitEmitter.registerListener(this.onMessageSubmit);
		}
	}
	
	
	componentWillUnmount() {
		//Unregistering the submit listener
		this.props.messageSubmitEmitter.unregisterListener(this.onMessageSubmit);
	}
	
	private readonly onMessageSubmit = () => {
		setTimeout(() => this.scrollToBottom(), 0);
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
		<div className={styles.progressContainer}>
			<CircularProgress />
		</div>
	);
}