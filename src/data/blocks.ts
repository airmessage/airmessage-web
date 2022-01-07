import {
	ParticipantActionType,
	MessageError,
	MessageStatusCode,
	ConversationItemType,
	ConversationPreviewType, MessageModifierType, TapbackType
} from "./stateCodes";

interface BaseConversation {
	localID: number;
	service: string;
	name?: string;
	members: string[];
	preview: ConversationPreview;
	unreadMessages: boolean;
	//Whether this conversation was created locally,
	//and needs to be matched with a conversation on the server
	localOnly: boolean;
}

export interface LinkedConversation extends BaseConversation {
	guid: string;
	localOnly: false;
}

export interface LocalConversation extends BaseConversation {
	localOnly: true;
}

export type Conversation = LinkedConversation | LocalConversation;

interface ConversationPreviewBase {
	readonly type: ConversationPreviewType;
	readonly date: Date;
}

export interface ConversationPreviewMessage extends ConversationPreviewBase {
	readonly type: ConversationPreviewType.Message;
	readonly text?: string;
	readonly sendStyle?: string;
	readonly attachments: string[];
}

export interface ConversationPreviewChatCreation extends ConversationPreviewBase {
	readonly type: ConversationPreviewType.ChatCreation;
}

export type ConversationPreview = ConversationPreviewMessage | ConversationPreviewChatCreation;

export interface ConversationItemBase {
	readonly itemType: ConversationItemType;
	readonly localID?: number;
	readonly serverID?: number;
	readonly guid?: string;
	readonly chatGuid?: string;
	readonly chatLocalID?: number;
	readonly date: Date;
}

export interface MessageItem extends ConversationItemBase {
	readonly itemType: ConversationItemType.Message;
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

export interface ParticipantAction extends ConversationItemBase {
	readonly itemType: ConversationItemType.ParticipantAction;
	readonly type: ParticipantActionType;
	readonly user?: string;
	readonly target?: string;
}

export interface ChatRenameAction extends ConversationItemBase {
	readonly itemType: ConversationItemType.ChatRenameAction;
	readonly user: string;
	readonly chatName: string;
}

export type ConversationItem = MessageItem | ParticipantAction | ChatRenameAction;

export interface QueuedFile {
	id: number;
	file: File;
}