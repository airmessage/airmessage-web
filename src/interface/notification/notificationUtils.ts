import {
  Conversation,
  LinkedConversation,
  MessageItem,
} from "shared/data/blocks";
import {
  getMemberTitle,
  mimeTypeToPreview,
} from "shared/util/conversationUtils";
import { appleSendStyleBubbleInvisibleInk } from "shared/data/appleConstants";
import EventEmitter from "shared/util/eventEmitter";

export abstract class NotificationUtils {
  /**
   * Initializes the notifications interface.
   * This function may show user prompts, so it should only be
   * called when the app is ready to send notifications.
   */
  abstract initialize(): void;

  /**
   * Shows a notification.
   * The platform determines whether notifications are persisted or stacked.
   * @param conversation The conversation of the messages
   * @param messages An array of message items to notify, sorted oldest to newest
   */
  abstract showMessageNotifications(
    conversation: LinkedConversation,
    messages: MessageItem[]
  ): void;

  /**
   * Dismisses notifications for a certain chat
   * @param chatID The ID of the chat to remove notifications for
   */
  abstract dismissMessageNotifications(chatID: string): void;

  /**
   * Gets an emitter that emits the conversation GUID for selected notifications
   */
  abstract getMessageActionEmitter(): EventEmitter<string>;

  /**
   * Shows a notification for the current caller, or dismisses the notification if there is no caller
   * @param caller The caller to display, or undefined to hide the notification
   */
  abstract updateCallerNotification(caller: string | undefined): void;

  /**
   * Gets emitter that emits user actions for call notifications
   */
  abstract getCallerActionEmitter(): EventEmitter<CallerNotificationAction>;
}

export type CallerNotificationAction = {
  caller: string;
  action: "accept" | "decline";
};

let notificationUtils: NotificationUtils;
export function setNotificationUtils(value: NotificationUtils) {
  notificationUtils = value;
}
export function getNotificationUtils() {
  return notificationUtils;
}

/**
 * Gets the display title of a conversation
 * @param conversation The conversation to generate a title for
 */
export function getConversationTitle(
  conversation: Conversation
): Promise<string> {
  if (conversation.name) return Promise.resolve(conversation.name);
  else return getMemberTitle(conversation.members);
}

/**
 * Gets the display message for a message item
 * @param message The message to generate a preview for
 */
export function getMessageDescription(message: MessageItem): string {
  if (message.sendStyle === appleSendStyleBubbleInvisibleInk)
    return "Message sent with Invisible Ink";
  else if (message.text) return message.text;
  else if (message.attachments.length > 0) {
    if (message.attachments.length === 1)
      return mimeTypeToPreview(message.attachments[0].type);
    else return `${message.attachments.length} attachments`;
  } else return "Unknown message";
}
