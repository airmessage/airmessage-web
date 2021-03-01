import {
	ChatRenameAction,
	Conversation,
	ConversationItem,
	ConversationPreview,
	ConversationPreviewMessage,
	MessageItem, MessageModifier,
	ParticipantAction, StatusUpdate, StickerItem, TapbackItem
} from "../data/blocks";
import {ConversationItemType, ConversationPreviewType, MessageModifierType} from "../data/stateCodes";
import {MessageFlow} from "../components/messaging/thread/item/Message";
import {findPerson} from "./peopleUtils";
import {parsePhoneNumberFromString} from "libphonenumber-js";

//Message burst - Sending single messages one after the other
//Used to decide if adjacent messages should be "attached" together
export const thresholdAnchor = 30 * 1000; //30 seconds
//Message session - A conversation session, where conversation participants are active
//Used to decide if a time divider should be displayed
export const thresholdHeader = 5 * 60 * 1000; //5 minutes

export function getFallbackTitle(conversation: Conversation): string {
	//Returning the conversation's name if it has one
	if(conversation.name) return conversation.name;
	
	//Building a name from the conversation members
	return buildListString(conversation.members);
}

export async function getNamedTitle(conversation: Conversation): Promise<string> {
	//Duplicating the member array (in case any modifications are made to the conversation in the meantime)
	const memberArray = [...conversation.members];
	
	//Fetching member names
	const resultArray = await Promise.allSettled(memberArray.map((member) => findPerson(member)));
	
	//Rebuilding the member array with names
	const memberNameArray: string[] = [];
	for(let i = 0; i < resultArray.length; i++) {
		const result = resultArray[i];
		if(result.status === "fulfilled") {
			memberNameArray[i] = result.value.name ?? memberArray[i];
		} else {
			//Defaulting to the user's address
			memberNameArray[i] = memberArray[i];
		}
	}
	
	//Building a string from the member names
	return buildListString(memberNameArray);
}

export function mimeTypeToDisplay(type: string): string {
	if(type.startsWith("image/")) return "Image";
	else if(type.startsWith("video/")) return "Video";
	else if(type.startsWith("audio/")) return "Audio";
	else return "File";
}

export function mimeTypeToPreview(type: string): string {
	if(type.startsWith("image/")) return "Image file";
	else if(type.startsWith("video/")) return "Video file";
	else if(type.startsWith("audio/")) return "Audio message";
	else return "Attachment file";
}

export function isConversationItemMessage(item: ConversationItem): item is MessageItem {
	return item.itemType === ConversationItemType.Message;
}

export function isConversationItemParticipantAction(item: ConversationItem): item is ParticipantAction {
	return item.itemType === ConversationItemType.ParticipantAction;
}

export function isConversationItemChatRenameAction(item: ConversationItem): item is ChatRenameAction {
	return item.itemType === ConversationItemType.ChatRenameAction;
}

export function isConversationPreviewMessage(item: ConversationPreview): item is ConversationPreviewMessage {
	return item.type === ConversationPreviewType.Message;
}

export function isModifierStatusUpdate(item: MessageModifier): item is StatusUpdate {
	return item.type === MessageModifierType.StatusUpdate;
}

export function isModifierSticker(item: MessageModifier): item is StickerItem {
	return item.type === MessageModifierType.Sticker;
}

export function isModifierTapback(item: MessageModifier): item is TapbackItem {
	return item.type === MessageModifierType.Tapback;
}

export function getMessageFlow(main: MessageItem, above?: ConversationItem, below?: ConversationItem): MessageFlow {
	//Creating the default message flow object
	const messageFlow: MessageFlow = {
		anchorTop: false,
		anchorBottom: false,
		showDivider: true
	};
	
	//Checking if there is a valid message above
	if(above && isConversationItemMessage(above)) {
		const timeDiff = Math.abs(main.date.getTime() - above.date.getTime());
		
		messageFlow.anchorTop = main.sender === above.sender && timeDiff < thresholdAnchor;
		messageFlow.showDivider = timeDiff > thresholdHeader;
	}
	
	//Checking if there is a valid message below
	if(below && isConversationItemMessage(below)) {
		const timeDiff = Math.abs(main.date.getTime() - below.date.getTime());
		
		messageFlow.anchorBottom = main.sender === below.sender && timeDiff < thresholdAnchor;
	}
	
	//Returning the result
	return messageFlow;
}

export function messageItemToConversationPreview(messageItem: MessageItem): ConversationPreviewMessage {
	return {
		type: ConversationPreviewType.Message,
		date: messageItem.date,
		text: messageItem.text,
		sendStyle: messageItem.sendStyle,
		attachments: messageItem.attachments.map(attachment => attachment.type)
	};
}

export function formatAddress(address: string): string {
	if(address.includes("@")) {
		//Email addresses can't be formatted
		return address;
	}
	
	const phone = parsePhoneNumberFromString(address);
	if(phone) {
		//Format phone numbers with national formatting (ex. (213) 373-4135)
		return phone.formatNational();
	}
	
	//Unknown address format
	return address;
}

function buildListString(parts: string[]): string {
	if(parts.length === 0) return "";
	else if(parts.length === 1) return parts[0];
	else if(parts.length === 2) return `${parts[0]} and ${parts[1]}`;
	else return parts.slice(0, parts.length - 1).join(", ") + ", and " + parts[parts.length - 1];
}