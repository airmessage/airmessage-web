import {
	ParticipantActionType,
	MessageError,
	MessageStatusCode,
	ConversationItemType,
	ConversationPreviewType, MessageModifierType, TapbackType
} from "./stateCodes";

export interface Conversation {
	readonly guid: string;
	readonly service: string;
	name?: string;
	members: string[];
	preview: ConversationPreview;
	unreadMessages?: boolean;
}

export interface ConversationPreview {
	readonly type: ConversationPreviewType;
	readonly date: Date;
}

export interface ConversationPreviewMessage extends ConversationPreview {
	readonly text?: string;
	readonly sendStyle?: string;
	readonly attachments: string[];
}

export interface ConversationItem {
	readonly itemType: ConversationItemType;
	readonly localID?: number;
	readonly serverID?: number;
	readonly guid?: string;
	readonly chatGuid: string;
	readonly date: Date;
}

export interface MessageItem extends ConversationItem {
	readonly text?: string;
	readonly subject?: string;
	readonly sender?: string;
	readonly attachments: AttachmentItem[];
	readonly stickers: StickerItem[];
	readonly tapbacks: TapbackItem[];
	readonly sendStyle?: string;
	status: MessageStatusCode;
	statusDate?: Date;
	error?: MessageError;
	progress?: number; //Undefined for hide, -1 for indeterminate, 0-100 for determinate
}

export interface AttachmentItem {
	readonly localID?: number;
	readonly guid?: string;
	readonly name: string;
	readonly type: string;
	readonly size: number;
	checksum?: string;
	data?: File;
}

export interface MessageModifier {
	readonly type: MessageModifierType;
	readonly messageGuid: string;
}

export interface StatusUpdate extends MessageModifier {
	status: MessageStatusCode;
	date?: Date;
}

export interface StickerItem extends MessageModifier {
	readonly messageIndex: number;
	readonly sender: string;
	
	readonly date: Date;
	readonly dataType: string;
	readonly data: ArrayBuffer;
}

export interface TapbackItem extends MessageModifier {
	readonly messageIndex: number;
	readonly sender: string;
	
	readonly isAddition: boolean;
	readonly tapbackType: TapbackType;
}

export interface ParticipantAction extends ConversationItem {
	readonly type: ParticipantActionType;
	readonly user?: string;
	readonly target?: string;
}

export interface ChatRenameAction extends ConversationItem {
	readonly user: string;
	readonly chatName: string;
}

export interface QueuedFile {
	id: number;
	file: File;
}