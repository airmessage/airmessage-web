import {Conversation, MessageItem} from "../data/blocks";
import {getNamedTitle, mimeTypeToPreview} from "./conversationUtils";
import EventEmitter from "./eventEmitter";
import {appleSendStyleBubbleInvisibleInk} from "../data/appleConstants";

const notificationBacklog: Map<string, [Notification, number]> = new Map();
export const notificationClickEmitter: EventEmitter<string> = new EventEmitter();

export function initializeNotifications() {
	//Requesting permission to send notifications
	if(Notification.permission === "default") {
		setTimeout(() => Notification.requestPermission(), 1000);
	}
}

export function sendMessageNotification(conversation: Conversation, message: MessageItem, itemCount: number) {
	//Ignoring if the app isn't allowed to send notifications
	if(Notification.permission !== "granted") return;
	
	//Getting the conversation title to display in the notification
	getConversationTitle(conversation).then((title) => {
		const chatGUID = conversation.guid;
		
		//Getting the count from the backlog
		let finalItemCount: number;
		const backlogEntry = notificationBacklog.get(chatGUID);
		if(backlogEntry) {
			finalItemCount = backlogEntry[1] + itemCount;
		} else {
			finalItemCount = itemCount;
		}
		
		//Building the title based off of the item count
		let displayTitle: string;
		if(finalItemCount === 1) displayTitle = title;
		else displayTitle = `${title} • ${finalItemCount} new`;
		
		//Creating the notification
		const notification = new Notification(displayTitle, {
			body: getMessagePreview(message),
			tag: chatGUID
		});
		
		//Notify listeners when the notification is clicked
		notification.onclick = () => {
			window.focus(); //Chromium
			notificationClickEmitter.notify(chatGUID);
		};
		
		//Remove the notification from the backlog when the notification is closed
		notification.onclose = () => notificationBacklog.delete(chatGUID);
		
		//Updating the backlog
		notificationBacklog.set(chatGUID, [notification, finalItemCount]);
	});
}

export function dismissMessageNotifications(chatGUID: string) {
	//Fetching the entry from the backlog (and ignoring if it doesn't exist)
	const entry = notificationBacklog.get(chatGUID);
	if(!entry) return;
	
	//Closing the notification and deleting it from the backlog
	entry[0].close();
	notificationBacklog.delete(chatGUID);
}

async function getConversationTitle(conversation: Conversation) {
	if(conversation.name) return conversation.name;
	else return getNamedTitle(conversation);
}

function getMessagePreview(message: MessageItem) {
	if(message.sendStyle === appleSendStyleBubbleInvisibleInk) return "Message sent with Invisible Ink";
	else if(message.text) return message.text;
	else if(message.attachments.length > 0) {
		if(message.attachments.length === 1) return mimeTypeToPreview(message.attachments[0].type);
		else return `${message.attachments.length} attachments`;
	}
	else return "Unknown message";
}