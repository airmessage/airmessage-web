import {getConversationTitle, getMessageDescription, NotificationUtils} from "shared/util/notificationUtils";
import EventEmitter from "shared/util/eventEmitter";
import {LinkedConversation, MessageItem} from "shared/data/blocks";
import {windowsDismissNotifications, windowsShowNotification} from "./interopUtils";
import {findPerson} from "shared/util/peopleUtils";
import {PersonData} from "../../../window";

export default class WindowsNotificationUtils extends NotificationUtils {
	private readonly notificationClickEmitter = new EventEmitter<string>();
	
	initialize(): void {
	}
	
	async showNotifications(conversation: LinkedConversation, messages: MessageItem[]) {
		for(const message of messages) {
			if(message.sender === undefined) {
				console.warn("Failed to notify message with no sender", message);
				continue;
			} else if(message.guid === undefined) {
				console.warn("Failed to notify message with no GUID", message);
				continue;
			}
			const person: PersonData | undefined = await findPerson(message.sender).catch(() => undefined);
			const conversationTitle = await getConversationTitle(conversation);
			
			windowsShowNotification(
				conversation.guid,
				person?.id,
				message.guid,
				conversationTitle,
				person?.name ?? message.sender,
				getMessageDescription(message)
			);
		}
	}
	
	dismissNotifications(chatID: string) {
		windowsDismissNotifications(chatID);
	}
	
	getActionEmitter() {
		return this.notificationClickEmitter;
	}
}