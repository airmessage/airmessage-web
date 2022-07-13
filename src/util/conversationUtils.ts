import {
  ChatRenameAction,
  Conversation,
  ConversationItem,
  ConversationPreview,
  ConversationPreviewMessage,
  MessageItem,
  MessageModifier,
  ParticipantAction,
  StatusUpdate,
  StickerItem,
  TapbackItem,
} from "../data/blocks";
import {
  ConversationItemType,
  ConversationPreviewType,
  MessageModifierType,
  MessageStatusCode,
} from "../data/stateCodes";
import { findPerson } from "../interface/people/peopleUtils";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { buildListString } from "shared/util/languageUtils";
import { MessageFlow } from "shared/util/messageFlow";

//Message burst - Sending single messages one after the other
//Used to decide if adjacent messages should be "attached" together
export const thresholdAnchor = 30 * 1000; //30 seconds
//Message session - A conversation session, where conversation participants are active
//Used to decide if a time divider should be displayed
export const thresholdHeader = 5 * 60 * 1000; //5 minutes

export function getFallbackTitle(conversation: Conversation): string {
  //Returning the conversation's name if it has one
  if (conversation.name) return conversation.name;

  //Building a name from the conversation members
  return buildListString(conversation.members);
}

export async function getMemberTitle(members: string[]): Promise<string> {
  //Duplicating the member array (in case any modifications are made to the conversation in the meantime)
  const memberArray = [...members];

  //Fetching member names
  const resultArray = await Promise.allSettled(
    memberArray.map((member) => findPerson(member))
  );

  //Rebuilding the member array with names
  const memberNameArray: string[] = [];
  for (let i = 0; i < resultArray.length; i++) {
    const result = resultArray[i];
    if (result.status === "fulfilled") {
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
  if (type.startsWith("image/")) return "Image";
  else if (type.startsWith("video/")) return "Video";
  else if (type.startsWith("audio/")) return "Audio";
  else return "File";
}

export function mimeTypeToPreview(type: string): string {
  if (type.startsWith("image/")) return "Image file";
  else if (type.startsWith("video/")) return "Video file";
  else if (type.startsWith("audio/")) return "Audio message";
  else return "Attachment file";
}

export function isConversationItemMessage(
  item: ConversationItem
): item is MessageItem {
  return item.itemType === ConversationItemType.Message;
}

export function isConversationItemParticipantAction(
  item: ConversationItem
): item is ParticipantAction {
  return item.itemType === ConversationItemType.ParticipantAction;
}

export function isConversationItemChatRenameAction(
  item: ConversationItem
): item is ChatRenameAction {
  return item.itemType === ConversationItemType.ChatRenameAction;
}

export function isConversationPreviewMessage(
  item: ConversationPreview
): item is ConversationPreviewMessage {
  return item.type === ConversationPreviewType.Message;
}

export function isModifierStatusUpdate(
  item: MessageModifier
): item is StatusUpdate {
  return item.type === MessageModifierType.StatusUpdate;
}

export function isModifierSticker(item: MessageModifier): item is StickerItem {
  return item.type === MessageModifierType.Sticker;
}

export function isModifierTapback(item: MessageModifier): item is TapbackItem {
  return item.type === MessageModifierType.Tapback;
}

export function getMessageFlow(
  main: MessageItem,
  above?: ConversationItem,
  below?: ConversationItem
): MessageFlow {
  //Creating the default message flow object
  const messageFlow: MessageFlow = {
    anchorTop: false,
    anchorBottom: false,
    showDivider: true,
  };

  //Checking if there is a valid message above
  if (above && isConversationItemMessage(above)) {
    const timeDiff = Math.abs(main.date.getTime() - above.date.getTime());

    messageFlow.anchorTop =
      main.sender === above.sender && timeDiff < thresholdAnchor;
    messageFlow.showDivider = timeDiff > thresholdHeader;
  }

  //Checking if there is a valid message below
  if (below && isConversationItemMessage(below)) {
    const timeDiff = Math.abs(main.date.getTime() - below.date.getTime());

    messageFlow.anchorBottom =
      main.sender === below.sender && timeDiff < thresholdAnchor;
  }

  //Returning the result
  return messageFlow;
}

export function messageItemToConversationPreview(
  messageItem: MessageItem
): ConversationPreviewMessage {
  return {
    type: ConversationPreviewType.Message,
    date: messageItem.date,
    text: messageItem.text,
    sendStyle: messageItem.sendStyle,
    attachments: messageItem.attachments.map((attachment) => attachment.type),
  };
}

export function formatAddress(address: string): string {
  if (address.includes("@")) {
    //Email addresses can't be formatted
    return address;
  }

  const phone = parsePhoneNumberFromString(address);
  if (phone) {
    //Format phone numbers with national formatting (ex. (213) 373-4135)
    return phone.formatNational();
  }

  //Unknown address format
  return address;
}

let nextConversationLocalID = 0;
export function generateConversationLocalID(): number {
  return nextConversationLocalID++;
}

let nextMessageLocalID = 0;
export function generateMessageLocalID(): number {
  return nextMessageLocalID++;
}

let nextAttachmentLocalID = 0;
export function generateAttachmentLocalID(): number {
  return nextAttachmentLocalID++;
}

/**
 * Gets if a conversation item should be part of a conversation
 */
export function checkMessageConversationOwnership(
  conversation: Conversation,
  item: ConversationItem
): boolean {
  if (item.chatGuid !== undefined) {
    if (!conversation.localOnly) {
      return item.chatGuid === conversation.guid;
    }
  } else if (item.chatLocalID !== undefined) {
    return item.chatLocalID === conversation.localID;
  }

  return false;
}

/**
 * Finds the index of the unconfirmed message in the item array that
 * the new message item can be merged into, or -1 if no match is found
 */
export function findMatchingUnconfirmedMessageIndex(
  itemArray: ConversationItem[],
  newItem: MessageItem
): number {
  //If the message is incoming, we can't match the item
  if (newItem.sender !== undefined) return -1;

  //Try to find a matching unconfirmed message
  if (newItem.text !== undefined && newItem.attachments.length === 0) {
    return itemArray.findIndex(
      (existingItem) =>
        existingItem.itemType === ConversationItemType.Message &&
        existingItem.status === MessageStatusCode.Unconfirmed &&
        existingItem.sender === undefined &&
        existingItem.attachments.length === 0 &&
        existingItem.text === newItem.text
    );
  } else if (
    newItem.text === undefined &&
    newItem.attachments.length === 1 &&
    newItem.attachments[0].checksum !== undefined
  ) {
    return itemArray.findIndex(
      (existingItem) =>
        existingItem.itemType === ConversationItemType.Message &&
        existingItem.status === MessageStatusCode.Unconfirmed &&
        existingItem.sender === undefined &&
        existingItem.attachments.length === 1 &&
        existingItem.attachments[0].checksum === newItem.attachments[0].checksum
    );
  } else {
    return -1;
  }
}
