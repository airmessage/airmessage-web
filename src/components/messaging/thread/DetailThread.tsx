import React from "react";
import styles from "./DetailThread.module.css";

import * as ConnectionManager from "../../../connection/connectionManager";
import {messageUpdateEmitter, modifierUpdateEmitter} from "../../../connection/connectionManager";

import {Button, CircularProgress, Typography} from "@material-ui/core";
import {Conversation, ConversationItem, MessageItem, MessageModifier, QueuedFile} from "../../../data/blocks";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import {
	getFallbackTitle,
	getMemberTitle,
	isConversationItemMessage,
	isModifierStatusUpdate,
	isModifierSticker,
	isModifierTapback
} from "../../../util/conversationUtils";
import {ConversationItemType, MessageError, MessageStatusCode} from "../../../data/stateCodes";
import {DetailFrame} from "../master/DetailFrame";
import EventEmitter from "../../../util/eventEmitter";
import {dismissMessageNotifications} from "../../../util/notifyUtils";
import {playSoundMessageOut} from "../../../util/soundUtils";
import {appleServiceAppleMessage} from "../../../data/appleConstants";

type HistoryLoadState = "idle" | "loading" | "complete";

interface Props {
	conversation: Conversation;
}

interface State {
	display: Display;
	unconfirmedMessages: MessageItem[];
	title?: string;
	message: string;
	attachments: QueuedFile[];
	historyLoadState: HistoryLoadState;
}

interface Display {
	type: "loading" | "error" | "messages";
}

interface DisplayMessages extends Display {
	type: "messages";
	data: ConversationItem[];
}

export function isDisplayMessages(display: Display): display is DisplayMessages {
	return display.type === "messages";
}

export default class DetailThread extends React.Component<Props, State> {
	readonly dragDropRef = React.createRef<HTMLDivElement>();
	readonly messageSubmitEmitter = new EventEmitter();
	
	state: Readonly<State> = {
		display: {type: "loading"},
		unconfirmedMessages: [],
		title: getFallbackTitle(this.props.conversation),
		message: "",
		attachments: [],
		historyLoadState: "idle"
	};
	private _nextMessageID: number = 0;
	private _nextAttachmentID: number = 0;
	//private dragCounter: number = 0;
	
	private get nextMessageID(): number {
		//Increasing the next message ID
		if(this._nextMessageID === Number.MAX_VALUE) this._nextMessageID = Number.MIN_VALUE;
		else this._nextMessageID++;
		
		//Returning the next message ID
		return this._nextMessageID;
	}
	
	private get nextAttachmentID(): number {
		//Increasing the next attachment ID
		if(this._nextAttachmentID === Number.MAX_VALUE) this._nextAttachmentID = Number.MIN_VALUE;
		else this._nextAttachmentID++;
		
		//Returning the next attachment ID
		return this._nextAttachmentID;
	}
	
	private handleMessageChange(messageText: string) {
		//Updating the message input
		this.setState({message: messageText});
	}
	
	private applyMessageError(error: MessageError, localID: number) {
		this.setState((prevState) => {
			//Ignoring if there are no messages
			if(!isDisplayMessages(prevState.display)) return null;
			
			//Updating the message's error state
			const pendingItems = [...prevState.display.data];
			const itemIndex = pendingItems.findIndex((item) => item.localID === localID);
			if(itemIndex !== -1) {
				pendingItems[itemIndex] = {
					...pendingItems[itemIndex],
					error: error
				} as MessageItem;
			}
			
			return {display: {type: "messages", data: pendingItems} as DisplayMessages};
		});
	}
	
	private handleMessageSubmit(messageText: string, queuedFiles: QueuedFile[]) {
		//Ignoring if there are no messages
		if(!isDisplayMessages(this.state.display)) return;
		
		const addedItems: MessageItem[] = [];
		
		//Handling the text message
		messageText = messageText.trim();
		if(messageText !== "") {
			//Clearing the message input
			this.setState({message: ""});
			
			//Creating the message and adding it to the chat
			const message: MessageItem = {
				itemType: ConversationItemType.Message,
				localID: this.nextMessageID,
				serverID: undefined,
				guid: undefined,
				chatGuid: this.props.conversation.guid,
				date: new Date(),
				
				text: messageText,
				subject: undefined,
				sender: undefined,
				attachments: [],
				stickers: [],
				tapbacks: [],
				sendStyle: undefined,
				status: MessageStatusCode.Unconfirmed,
				error: undefined,
				statusDate: undefined
			};
			
			//Sending the message
			ConnectionManager.sendMessage(this.props.conversation.guid, messageText)
				.catch((error: MessageError) => this.applyMessageError(error, message.localID!));
			
			//Adding the item to the added items list
			addedItems.push(message);
		}
		//Handling attachments
		if(queuedFiles.length > 0) {
			//Clearing the attachments input
			this.setState({attachments: []});
			
			const messages = queuedFiles.map((file) => {
				return {
					itemType: ConversationItemType.Message,
					localID: this.nextMessageID,
					serverID: undefined,
					guid: undefined,
					chatGuid: this.props.conversation.guid,
					date: new Date(),
					
					text: undefined,
					subject: undefined,
					sender: undefined,
					attachments: [{
						localID: file.id,
						name: file.file.name,
						type: file.file.type,
						size: file.file.size,
						data: file.file
					}],
					stickers: [],
					tapbacks: [],
					sendStyle: undefined,
					status: MessageStatusCode.Unconfirmed,
					statusDate: undefined,
					error: undefined,
					progress: -1 //Show indeterminate progress by default for attachments
				} as MessageItem;
			});
			
			//Sending the messages
			for(const message of messages) {
				ConnectionManager.sendFile(this.props.conversation.guid, message.attachments[0].data!)
					.progress((progressData) => {
						this.setState((prevState) => {
							//Ignoring if there are no messages
							if(!isDisplayMessages(prevState.display)) return null;
							
							//Cloning the item array
							const pendingItems: ConversationItem[] = [...prevState.display.data];
							
							//Finding the item
							const itemIndex = pendingItems.findIndex((item) => item.localID === message.localID);
							if(itemIndex !== -1) {
								if(typeof progressData === "number") {
									//Updating the upload progress
									pendingItems[itemIndex] = {
										...pendingItems[itemIndex],
										progress: progressData / message.attachments[0].size * 100
									} as MessageItem;
								} else {
									//Updating the checksum
									pendingItems[itemIndex] = {
										...pendingItems[itemIndex],
										attachments: [{
											...(pendingItems[itemIndex] as MessageItem).attachments[0],
											checksum: progressData
										}]
									} as MessageItem;
								}
							}
							
							return {display: {type: "messages", data: pendingItems} as DisplayMessages};
						});
					})
					.then(() => {
						this.setState((prevState) => {
							//Ignoring if there are no messages
							if(!isDisplayMessages(prevState.display)) return null;
							
							//Cloning the item array
							const pendingItems: ConversationItem[] = [...prevState.display.data];
							
							//Finding the item
							const itemIndex = pendingItems.findIndex((item) => item.localID === message.localID);
							if(itemIndex !== -1) {
								//Clearing the item's upload progress
								pendingItems[itemIndex] = {
									...pendingItems[itemIndex],
									progress: undefined
								} as MessageItem;
							}
							
							return {display: {type: "messages", data: pendingItems} as DisplayMessages};
						});
					})
					.catch((error: MessageError) => this.applyMessageError(error, message.localID!));
			}
			
			//Adding the items to the added items list
			addedItems.push(...messages);
		}
		
		if(addedItems.length > 0) {
			//Notifying message listeners
			messageUpdateEmitter.notify(addedItems);
			this.messageSubmitEmitter.notify(undefined);
			
			//Playing a sound
			playSoundMessageOut();
		}
	}
	
	private handleAttachmentRemove(file: QueuedFile) {
		this.setState(state => {
			const attachments = [...state.attachments];
			const itemIndex = attachments.findIndex((queuedFile) => file.id === queuedFile.id);
			if(itemIndex !== -1) {
				attachments.splice(itemIndex, 1);
			}
			return {attachments: attachments};
		});
	}
	
	private handleAttachmentAdd(files: File[]) {
		const queuedFiles: QueuedFile[] = files.map((file) => {
			return {id: this.nextAttachmentID, file: file};
		});
		
		this.setState(state => {
			return {attachments: state.attachments.concat(...queuedFiles)};
		});
	}
	
	private readonly handleDragIn = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		
		//this.dragCounter++;
		//this.setState({dragHighlight: true});
	};
	
	private readonly handleDragOut = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		
		/* this.dragCounter--;
		if(this.dragCounter === 0) {
			this.setState({dragHighlight: false});
		} */
	};
	
	private readonly handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		
		if(event.dataTransfer) event.dataTransfer.dropEffect = "copy";
	};
	
	private readonly handleDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		
		//this.setState({dragHighlight: false});
		//this.dragCounter = 0;
		
		//Adding the files
		if(event.dataTransfer) {
			const files: QueuedFile[] = [...event.dataTransfer.files].map((file) => {
				return {id: this.nextAttachmentID, file: file};
			});
			
			this.setState(state => {
				return {attachments: state.attachments.concat(...files)};
			});
		}
	};
	
	private readonly handleRequestHistory = () => {
		//Returning if the state is already loading or is complete
		if(this.state.historyLoadState !== "idle") return;
		
		//Fetching history
		const items = (this.state.display as DisplayMessages).data;
		ConnectionManager.fetchThread(this.props.conversation.guid, items[items.length - 1].serverID).then(data => {
			if(data.length > 0) {
				//Add the new items to the end of the array, and reset the load state
				this.setState((prevState) => {
					if(!isDisplayMessages(prevState.display)) return null;
					
					return {
						display: {type: "messages", data: prevState.display.data.concat(data)} as DisplayMessages,
						historyLoadState: "idle"
					};
				});
			} else {
				//No more history, we're done
				this.setState({historyLoadState: "complete"});
			}
		}).catch(() => {
			//Ignore, and wait for the user to retry
			this.setState({historyLoadState: "idle"});
		});
		
		//Setting the state
		this.setState({historyLoadState: "loading"});
	};
	
	private readonly requestMessages = () => {
		//Fetching thread messages
		ConnectionManager.fetchThread(this.props.conversation.guid).then(data => {
			this.setState({display: {type: "messages", data: data} as DisplayMessages});
		}).catch(() => {
			this.setState({display: {type: "error"}});
		});
	};
	
	render() {
		//Creating the body view (use a loading spinner while conversation details aren't available)
		let body: React.ReactNode;
		if(isDisplayMessages(this.state.display)) {
			body = <MessageList conversation={this.props.conversation} items={this.state.display.data} messageSubmitEmitter={this.messageSubmitEmitter} showHistoryLoader={this.state.historyLoadState === "loading"} onRequestHistory={this.handleRequestHistory} />;
		} else if(this.state.display.type === "loading") {
			body = (
				<div className={styles.centerContainer}>
					<CircularProgress />
				</div>
			);
		} else if(this.state.display.type === "error") {
			body = (
				<div className={styles.centerContainer}>
					<Typography color="textSecondary" gutterBottom>Couldn&apos;t load this conversation</Typography>
					<Button onClick={this.requestMessages}>Retry</Button>
				</div>
			);
		}
		
		let inputPlaceholder: string;
		if(this.props.conversation.service === appleServiceAppleMessage) {
			inputPlaceholder = "iMessage";
		} else {
			inputPlaceholder = "Text message";
		}
		
		//Returning the element
		return (
			<DetailFrame title={this.state.title ?? ""} ref={this.dragDropRef}>
				<div className={styles.body}>{body}</div>
				<div className={styles.input}>
					<MessageInput placeholder={inputPlaceholder} message={this.state.message} attachments={this.state.attachments}
								  onMessageChange={this.handleMessageChange.bind(this)} onMessageSubmit={this.handleMessageSubmit.bind(this)}
								  onAttachmentAdd={this.handleAttachmentAdd.bind(this)} onAttachmentRemove={this.handleAttachmentRemove.bind(this)} />
				</div>
			</DetailFrame>
		);
	}
	
	componentDidMount() {
		//Clearing notifications
		dismissMessageNotifications(this.props.conversation.guid);
		
		//Fetching messages
		this.requestMessages();
		
		//Building a conversation title from the participants' names if the conversation isn't explicitly named
		if(!this.props.conversation.name) {
			getMemberTitle(this.props.conversation.members).then((title) => {
				this.setState({title: title});
			});
		}
		
		//Subscribing to message updates
		messageUpdateEmitter.registerListener(this.onMessageUpdate);
		modifierUpdateEmitter.registerListener(this.onModifierUpdate);
		
		//Subscribing to drag-and-drop updates
		{
			const element = this.dragDropRef.current!;
			element.addEventListener("dragenter", this.handleDragIn);
			element.addEventListener("dragleave", this.handleDragOut);
			element.addEventListener("dragover", this.handleDragOver);
			element.addEventListener("drop", this.handleDrop);
		}
	}
	
	componentDidUpdate(prevProps: Readonly<Props>) {
		//Checking if the conversation's title or members have changed
		if(this.props.conversation.name !== prevProps.conversation.name || this.props.conversation.members !== prevProps.conversation.members) {
			//Updating the conversation title
			if(this.props.conversation.name) {
				this.setState({title: this.props.conversation.name});
			} else {
				this.setState({title: getFallbackTitle(this.props.conversation)});
				getMemberTitle(this.props.conversation.members).then((title) => {
					this.setState({title: title});
				});
			}
		}
	}
	
	componentWillUnmount() {
		//Unsubscribing from message updates
		messageUpdateEmitter.unregisterListener(this.onMessageUpdate);
		modifierUpdateEmitter.unregisterListener(this.onModifierUpdate);
		
		//Unsubscribing to drag-and-drop updates
		{
			const element = this.dragDropRef.current!;
			element.removeEventListener("dragenter", this.handleDragIn);
			element.removeEventListener("dragleave", this.handleDragOut);
			element.removeEventListener("dragover", this.handleDragOver);
			element.removeEventListener("drop", this.handleDrop);
		}
	}
	
	private readonly onMessageUpdate = (itemArray: ConversationItem[]): void => {
		//Ignoring if the chat isn't loaded
		if(!isDisplayMessages(this.state.display)) return;
		
		//Merging the item into the conversation
		this.setState((prevState, props) => {
			if(!isDisplayMessages(prevState.display)) return null;
			
			//Filtering out items that aren't part of this conversation
			const newItemArray = itemArray.filter((item) => item.chatGuid === props.conversation.guid);
			
			//Cloning the item array
			const pendingItemArray: ConversationItem[] = [...prevState.display.data];
			
			//Iterating over new items
			for(let i = 0; i < newItemArray.length; i++) {
				const newItem = newItemArray[i];
				
				//If this is not a message, or the message is incoming, we can't match the item
				if(!isConversationItemMessage(newItem) || newItem.sender) continue;
				
				//Trying to find a matching unconfirmed message
				let matchedIndex: number = -1;
				if(newItem.text && newItem.attachments.length === 0) {
					matchedIndex = pendingItemArray.findIndex((existingItem) =>
						isConversationItemMessage(existingItem) &&
						existingItem.status === MessageStatusCode.Unconfirmed &&
						!existingItem.sender &&
						existingItem.attachments.length === 0 &&
						existingItem.text === newItem.text);
				} else if(!newItem.text && newItem.attachments.length === 1 && newItem.attachments[0].checksum) {
					matchedIndex = pendingItemArray.findIndex((existingItem) =>
						isConversationItemMessage(existingItem) &&
						existingItem.status === MessageStatusCode.Unconfirmed &&
						!existingItem.sender &&
						existingItem.attachments.length === 1 &&
						existingItem.attachments[0].checksum === newItem.attachments[0].checksum);
				}
				if(matchedIndex === -1) continue;
				
				//Merging the information into the item
				pendingItemArray[matchedIndex] = {
					...pendingItemArray[matchedIndex],
					serverID: newItem.serverID,
					guid: newItem.guid,
					date: newItem.date,
					status: newItem.status,
					error: newItem.error,
					statusDate: newItem.statusDate
				} as MessageItem;
				
				//Removing the new message from the new item array (since we've already added it to the conversation)
				newItemArray.splice(i, 1);
			}
			
			//Adding new unmatched conversation items to the start of the array
			pendingItemArray.unshift(...newItemArray);
			
			return {display: {type: "messages", data: pendingItemArray} as DisplayMessages};
		});
	};
	
	private readonly onModifierUpdate = (itemArray: MessageModifier[]): void => {
		//Ignoring if the chat isn't loaded
		if(!isDisplayMessages(this.state.display)) return;
		
		//Updating affected messages
		this.setState((prevState) => {
			if(!isDisplayMessages(prevState.display)) return null;
			
			//Cloning the item array
			const pendingItemArray: ConversationItem[] = [...prevState.display.data];
			
			for(const modifier of itemArray) {
				//Trying to match the modifier with an item
				const matchingIndex = pendingItemArray.findIndex((item) => isConversationItemMessage(item) && item.guid === modifier.messageGuid);
				if(matchingIndex === -1) continue;
				
				//Applying the modifier
				if(isModifierStatusUpdate(modifier)) {
					pendingItemArray[matchingIndex] = {
						...pendingItemArray[matchingIndex],
						status: modifier.status,
						statusDate: modifier.date
					} as MessageItem;
				} else if(isModifierSticker(modifier)) {
					pendingItemArray[matchingIndex] = {
						...pendingItemArray[matchingIndex],
						stickers: (pendingItemArray[matchingIndex] as MessageItem).stickers.concat(modifier),
					} as MessageItem;
				} else if(isModifierTapback(modifier)) {
					const pendingTapbacks = [...(pendingItemArray[matchingIndex] as MessageItem).tapbacks];
					const matchingTapbackIndex = pendingTapbacks.findIndex((tapback) => tapback.sender === modifier.sender);
					if(matchingTapbackIndex !== -1) pendingTapbacks[matchingTapbackIndex] = modifier;
					else pendingTapbacks.push(modifier);
					
					pendingItemArray[matchingIndex] = {
						...pendingItemArray[matchingIndex],
						tapbacks: pendingTapbacks
					} as MessageItem;
				}
			}
			
			return {display: {type: "messages", data: pendingItemArray} as DisplayMessages};
		});
	};
}