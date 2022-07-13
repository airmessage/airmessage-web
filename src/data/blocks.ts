import {
  ParticipantActionType,
  MessageError,
  MessageStatusCode,
  ConversationItemType,
  ConversationPreviewType,
  MessageModifierType,
  TapbackType,
} from "./stateCodes";

interface BaseConversation {
  localID: LocalConversationID;
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
  guid: RemoteConversationID;
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

export interface ConversationPreviewChatCreation
  extends ConversationPreviewBase {
  readonly type: ConversationPreviewType.ChatCreation;
}

export type ConversationPreview =
  | ConversationPreviewMessage
  | ConversationPreviewChatCreation;

export interface ConversationItemBase {
  readonly itemType: ConversationItemType;
  readonly localID?: number;
  readonly serverID?: number;
  readonly guid?: string;
  readonly chatGuid?: RemoteConversationID;
  readonly chatLocalID?: LocalConversationID;
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

export interface ResponseMessageModifier extends MessageModifier {
  readonly messageIndex: number;
  readonly sender: string;
}

export interface StickerItem extends ResponseMessageModifier {
  readonly date: Date;
  readonly dataType: string;
  readonly data: ArrayBuffer;
}

export interface TapbackItem extends ResponseMessageModifier {
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

export type ConversationItem =
  | MessageItem
  | ParticipantAction
  | ChatRenameAction;

export interface QueuedFile {
  id: number;
  file: File;
}

export type RemoteConversationID = string;
export type LocalConversationID = number;
export type MixedConversationID = RemoteConversationID | LocalConversationID;

/**
 * Gets a {@link MixedConversationID} from a conversation
 */
export function getConversationMixedID(
  conversation: Conversation
): MixedConversationID {
  if (conversation.localOnly) {
    return conversation.localID;
  } else {
    return conversation.guid;
  }
}

/**
 * Gets a {@link MixedConversationID} from a conversation item,
 * or undefined if the item has none
 */
export function getConversationItemMixedID(
  item: ConversationItem
): MixedConversationID | undefined {
  return item.chatGuid ?? item.chatLocalID;
}

export function isLocalConversationID(
  id: MixedConversationID | undefined
): id is LocalConversationID {
  return typeof id === "number";
}

export function isRemoteConversationID(
  id: MixedConversationID | undefined
): id is RemoteConversationID {
  return typeof id === "string";
}
