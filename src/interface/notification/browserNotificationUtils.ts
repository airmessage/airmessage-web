import {
  CallerNotificationAction,
  getConversationTitle,
  getMessageDescription,
  NotificationUtils,
} from "shared/interface/notification/notificationUtils";
import EventEmitter from "shared/util/eventEmitter";
import { LinkedConversation, MessageItem } from "shared/data/blocks";
import { playSoundNotification } from "shared/util/soundUtils";

export default class BrowserNotificationUtils extends NotificationUtils {
  private readonly messageNotificationBacklog = new Map<
    string,
    [Notification, number]
  >();
  private readonly messageNotificationClickEmitter = new EventEmitter<string>();

  private currentCallerNotification: Notification | undefined = undefined;
  private readonly callerNotificationActionEmitter =
    new EventEmitter<CallerNotificationAction>();

  initialize(): void {
    //Requesting permission to send notifications
    if (Notification.permission === "default") {
      setTimeout(() => Notification.requestPermission(), 1000);
    }
  }

  private notificationSoundPlayed = false;
  async showMessageNotifications(
    conversation: LinkedConversation,
    messages: MessageItem[]
  ) {
    //Ignoring if the app isn't allowed to send notifications,
    //or if there aren't any messages to notify
    if (Notification.permission !== "granted" || messages.length === 0) return;

    //Getting the conversation title to display in the notification
    const title = await getConversationTitle(conversation);

    //Getting the notification information
    const itemCount = messages.length;
    const chatGUID = conversation.guid;

    //Getting the count from the backlog
    let finalItemCount: number;
    const backlogEntry = this.messageNotificationBacklog.get(chatGUID);
    if (backlogEntry) {
      finalItemCount = backlogEntry[1] + itemCount;
    } else {
      finalItemCount = itemCount;
    }

    //Building the title based off of the item count
    let displayTitle: string;
    if (finalItemCount === 1) displayTitle = title;
    else displayTitle = `${title} • ${finalItemCount} new`;

    //Creating the notification
    const notification = new Notification(displayTitle, {
      body: getMessageDescription(messages[messages.length - 1]),
      tag: chatGUID,
    });

    //Notify listeners when the notification is clicked
    notification.onclick = () => {
      window.focus(); //Chromium
      this.messageNotificationClickEmitter.notify(chatGUID);
    };

    //Remove the notification from the backlog when the notification is closed
    notification.onclose = () =>
      this.messageNotificationBacklog.delete(chatGUID);

    //Updating the backlog
    this.messageNotificationBacklog.set(chatGUID, [
      notification,
      finalItemCount,
    ]);

    //Playing a sound (limit to once every second)
    if (!this.notificationSoundPlayed) {
      playSoundNotification();
      this.notificationSoundPlayed = true;
      setTimeout(() => (this.notificationSoundPlayed = false), 1000);
    }
  }

  dismissMessageNotifications(chatID: string) {
    //Fetching the entry from the backlog (and ignoring if it doesn't exist)
    const entry = this.messageNotificationBacklog.get(chatID);
    if (!entry) return;

    //Closing the notification and deleting it from the backlog
    entry[0].close();
    this.messageNotificationBacklog.delete(chatID);
  }

  getMessageActionEmitter() {
    return this.messageNotificationClickEmitter;
  }

  updateCallerNotification(caller: string | undefined): void {
    if (caller !== undefined) {
      const notification = new Notification(caller, {
        body: "FaceTime",
        tag: "facetime",
        requireInteraction: true,
      });

      //Focus the window when the user selects the notification
      notification.onclick = () => window.focus();
      notification.onclose = () => (this.currentCallerNotification = undefined);
      this.currentCallerNotification = notification;
    } else {
      //Dismiss the notification
      this.currentCallerNotification?.close();
      this.currentCallerNotification = undefined;
    }
  }

  getCallerActionEmitter(): EventEmitter<CallerNotificationAction> {
    return this.callerNotificationActionEmitter;
  }
}
