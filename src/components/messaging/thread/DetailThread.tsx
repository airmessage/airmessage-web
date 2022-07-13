import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationItem,
  LocalConversationID,
  MessageItem,
  MessageModifier,
  QueuedFile,
} from "shared/data/blocks";
import MessageList from "shared/components/messaging/thread/MessageList";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { DetailFrame } from "shared/components/messaging/master/DetailFrame";
import MessageInput from "shared/components/messaging/thread/MessageInput";
import {
  useConversationTitle,
  useIsFaceTimeSupported,
  useUnsubscribeContainer,
} from "shared/util/hookUtils";
import { mapServiceName } from "shared/util/languageUtils";
import * as ConnectionManager from "shared/connection/connectionManager";
import {
  checkMessageConversationOwnership,
  findMatchingUnconfirmedMessageIndex,
  generateAttachmentLocalID,
  generateMessageLocalID,
  isModifierStatusUpdate,
  isModifierSticker,
  isModifierTapback,
} from "shared/util/conversationUtils";
import ConversationTarget from "shared/data/conversationTarget";
import {
  ConversationItemType,
  MessageError,
  MessageStatusCode,
} from "shared/data/stateCodes";
import EmitterPromiseTuple from "shared/util/emitterPromiseTuple";
import { playSoundMessageOut } from "shared/util/soundUtils";
import EventEmitter from "shared/util/eventEmitter";
import localMessageCache from "shared/state/localMessageCache";
import { installCancellablePromise } from "shared/util/cancellablePromise";

export default function DetailThread({
  conversation,
}: {
  conversation: Conversation;
}) {
  const [displayState, setDisplayState] = useState<DisplayState>({
    type: DisplayType.Loading,
  });
  const [historyLoadState, setHistoryLoadState] = useState(
    HistoryLoadState.Idle
  );

  const conversationTitle = useConversationTitle(conversation);
  const faceTimeSupported = useIsFaceTimeSupported();
  const messageSubmitEmitter = useRef(new EventEmitter<void>());

  const [messageInput, setMessageInput] = useState<string>("");
  const [attachmentInput, setAttachmentInput] = useState<QueuedFile[]>([]);

  /**
   * Requests messages, and updates the display state
   */
  const requestMessages = useCallback(() => {
    if (conversation.localOnly) {
      //Fetch messages from the cache
      setDisplayState({
        type: DisplayType.Messages,
        messages: localMessageCache.get(conversation.localID) ?? [],
      });

      return;
    }

    //Set the state to loading
    setDisplayState({ type: DisplayType.Loading });

    //Fetch messages from the server
    ConnectionManager.fetchThread(conversation.guid)
      .then((messages) => {
        setDisplayState({ type: DisplayType.Messages, messages: messages });
      })
      .catch(() => {
        setDisplayState({ type: DisplayType.Error });
      });
  }, [conversation, setDisplayState]);
  const loadedThreadMessages = useRef<LocalConversationID | undefined>(
    undefined
  );

  const requestHistoryUnsubscribeContainer = useUnsubscribeContainer([
    conversation.localID,
  ]);
  const requestHistory = useCallback(() => {
    //Return if this is a local conversation, or if the state is already loading or is complete
    if (
      displayState.type !== DisplayType.Messages ||
      conversation.localOnly ||
      historyLoadState !== HistoryLoadState.Idle
    )
      return;

    //Set the state to loading
    setHistoryLoadState(HistoryLoadState.Loading);

    //Fetch history
    const displayStateMessages = displayState.messages;

    //Make sure we cancel if the conversation changes while we're loading
    installCancellablePromise(
      ConnectionManager.fetchThread(
        conversation.guid,
        displayStateMessages[displayStateMessages.length - 1].serverID
      ),
      requestHistoryUnsubscribeContainer
    )
      .then((messages) => {
        if (messages.length > 0) {
          //Return to idle, and add new messages
          setHistoryLoadState(HistoryLoadState.Idle);

          setDisplayState((displayState) => {
            if (displayState.type !== DisplayType.Messages) return displayState;

            return {
              type: DisplayType.Messages,
              messages: displayState.messages.concat(messages),
            };
          });
        } else {
          //No more history, we're done
          setHistoryLoadState(HistoryLoadState.Complete);
        }
      })
      .catch(() => {
        //Ignore, and wait for the user to retry
        setHistoryLoadState(HistoryLoadState.Idle);
      });
  }, [
    conversation,
    displayState,
    setDisplayState,
    historyLoadState,
    setHistoryLoadState,
    requestHistoryUnsubscribeContainer,
  ]);

  //Request messages when the conversation changes
  useEffect(() => {
    if (loadedThreadMessages.current === conversation.localID) return;
    requestMessages();
    loadedThreadMessages.current = conversation.localID;
  }, [conversation.localID, requestMessages]);

  const handleMessageUpdate = useCallback(
    (itemArray: ConversationItem[]) => {
      setDisplayState((displayState) => {
        //Ignore if the chat isn't loaded
        if (displayState.type !== DisplayType.Messages) return displayState;

        //Clone the item array
        const pendingMessages = [...displayState.messages];
        const newMessages: ConversationItem[] = [];

        for (const newItem of itemArray) {
          //Ignore items that aren't part of this conversation
          if (!checkMessageConversationOwnership(conversation, newItem))
            continue;

          //Try to find a matching conversation item
          let itemMatched = false;
          if (newItem.itemType === ConversationItemType.Message) {
            const matchedIndex = findMatchingUnconfirmedMessageIndex(
              pendingMessages,
              newItem
            );
            if (matchedIndex !== -1) {
              //Merge the information into the item
              const mergeTargetItem = pendingMessages[
                matchedIndex
              ] as MessageItem;
              pendingMessages[matchedIndex] = {
                ...mergeTargetItem,
                serverID: newItem.serverID,
                guid: newItem.guid,
                date: newItem.date,
                status: newItem.status,
                error: newItem.error,
                statusDate: newItem.statusDate,
              };

              itemMatched = true;
            }
          }

          //If we didn't merge this item, add it to the end of the message list
          if (!itemMatched) {
            newMessages.push(newItem);
          }
        }

        pendingMessages.unshift(...newMessages);

        return { type: DisplayType.Messages, messages: pendingMessages };
      });
    },
    [setDisplayState, conversation]
  );

  //Subscribe to message updates
  useEffect(() => {
    return ConnectionManager.messageUpdateEmitter.subscribe(
      handleMessageUpdate
    );
  }, [handleMessageUpdate]);

  const handleModifierUpdate = useCallback(
    (itemArray: MessageModifier[]) => {
      setDisplayState((displayState) => {
        //Ignore if the chat isn't loaded
        if (displayState.type !== DisplayType.Messages) return displayState;

        //Cloning the item array
        const pendingItemArray = [...displayState.messages];

        for (const modifier of itemArray) {
          //Try to match the modifier with an item
          const matchingIndex = pendingItemArray.findIndex(
            (item) =>
              item.itemType === ConversationItemType.Message &&
              item.guid === modifier.messageGuid
          );
          if (matchingIndex === -1) continue;
          const matchedItem = pendingItemArray[matchingIndex] as MessageItem;

          //Apply the modifier
          if (isModifierStatusUpdate(modifier)) {
            pendingItemArray[matchingIndex] = {
              ...matchedItem,
              status: modifier.status,
              statusDate: modifier.date,
            };
          } else if (isModifierSticker(modifier)) {
            pendingItemArray[matchingIndex] = {
              ...matchedItem,
              stickers: matchedItem.stickers.concat(modifier),
            } as MessageItem;
          } else if (isModifierTapback(modifier)) {
            const pendingTapbacks = [...matchedItem.tapbacks];
            const matchingTapbackIndex = pendingTapbacks.findIndex(
              (tapback) => tapback.sender === modifier.sender
            );
            if (matchingTapbackIndex !== -1)
              pendingTapbacks[matchingTapbackIndex] = modifier;
            else pendingTapbacks.push(modifier);

            pendingItemArray[matchingIndex] = {
              ...matchedItem,
              tapbacks: pendingTapbacks,
            };
          }
        }

        return { type: DisplayType.Messages, messages: pendingItemArray };
      });
    },
    [setDisplayState]
  );

  //Subscribe to modifier updates
  useEffect(() => {
    return ConnectionManager.modifierUpdateEmitter.subscribe(
      handleModifierUpdate
    );
  }, [handleModifierUpdate]);

  //Add an attachment to the attachment input
  const addAttachment = useCallback(
    (files: File[]) => {
      setAttachmentInput((attachments) => [
        ...attachments,
        ...files.map(
          (file): QueuedFile => ({
            id: generateAttachmentLocalID(),
            file: file,
          })
        ),
      ]);
    },
    [setAttachmentInput]
  );

  //Remove an attachment from the attachment input
  const removeAttachment = useCallback(
    (file: QueuedFile) => {
      setAttachmentInput((attachments) =>
        attachments.filter((queuedFile) => queuedFile.id !== file.id)
      );
    },
    [setAttachmentInput]
  );

  //Clear subscriptions when the display state or conversation changes
  const uploadSubscriptionsContainer = useUnsubscribeContainer([
    conversation.localID,
    displayState.type,
  ]);

  /**
   * Applies a message error the message with the specified ID
   */
  const applyMessageError = useCallback(
    (localID: LocalConversationID, error: MessageError) => {
      setDisplayState((displayState) => {
        //Ignore if there are no messages
        if (displayState.type !== DisplayType.Messages) return displayState;

        //Update the message's error state
        const pendingItems = [...displayState.messages];
        const itemIndex = pendingItems.findIndex(
          (item) => item.localID === localID
        );
        if (itemIndex !== -1) {
          const message = pendingItems[itemIndex] as MessageItem;
          pendingItems[itemIndex] = {
            ...message,
            error: error,
          };
        }

        return { type: DisplayType.Messages, messages: pendingItems };
      });
    },
    [setDisplayState]
  );

  /**
   * Subscribes to an upload progress for an outgoing attachment message
   */
  const registerUploadProgress = useCallback(
    (
      messageID: LocalConversationID,
      uploadProgress: EmitterPromiseTuple<number | string, void>
    ) => {
      /**
       * Updates the target message state
       * @param updater A function that takes a {@link MessageItem},
       * and returns a modified partial
       */
      const updateMessage = (
        updater: (message: MessageItem) => Partial<MessageItem>
      ) => {
        setDisplayState((displayState) => {
          //Ignore if there are no messages
          if (displayState.type !== DisplayType.Messages) return displayState;

          //Clone the item array
          const pendingItems: ConversationItem[] = [...displayState.messages];

          //Find the item
          const itemIndex = pendingItems.findIndex(
            (item) => item.localID === messageID
          );
          if (itemIndex === -1) return displayState;
          const message = pendingItems[itemIndex] as MessageItem;

          //Update the item
          pendingItems[itemIndex] = { ...message, ...updater(message) };

          return { type: DisplayType.Messages, messages: pendingItems };
        });
      };

      //Sync the progress meter
      uploadProgress.emitter.subscribe((progressData) => {
        updateMessage((message) => {
          if (typeof progressData === "number") {
            //Update the upload progress
            return {
              progress: (progressData / message.attachments[0].size) * 100,
            };
          } else {
            //Update the checksum
            return {
              attachments: [
                {
                  ...message.attachments[0],
                  checksum: progressData,
                },
              ],
            };
          }
        });
      }, uploadSubscriptionsContainer);

      //Remove the progress when the file is finished uploading
      installCancellablePromise(
        uploadProgress.promise,
        uploadSubscriptionsContainer
      )
        .then(() => {
          updateMessage(() => ({
            progress: undefined,
          }));
        })
        .catch((error: MessageError) => applyMessageError(messageID, error));
    },
    [setDisplayState, applyMessageError, uploadSubscriptionsContainer]
  );

  const submitInput = useCallback(
    (messageText: string, queuedFileArray: QueuedFile[]) => {
      //Ignore if messages aren't loaded
      if (displayState.type !== DisplayType.Messages) return;

      //Get the conversation target
      const conversationTarget: ConversationTarget = !conversation.localOnly
        ? {
            type: "linked",
            guid: conversation.guid,
          }
        : {
            type: "unlinked",
            members: conversation.members,
            service: conversation.service,
          };

      const addedItems: MessageItem[] = [];

      //Check if there is a message input
      const trimmedMessageText = messageText.trim();
      if (trimmedMessageText !== "") {
        //Create the message
        const messageLocalID = generateMessageLocalID();
        const message: MessageItem = {
          itemType: ConversationItemType.Message,
          localID: messageLocalID,
          serverID: undefined,
          guid: undefined,
          chatGuid: conversation.localOnly ? undefined : conversation.guid,
          chatLocalID: conversation.localID,
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
          statusDate: undefined,
        };

        //Send the message
        ConnectionManager.sendMessage(conversationTarget, messageText).catch(
          (error: MessageError) => applyMessageError(messageLocalID, error)
        );

        //Keep track of the message
        addedItems.push(message);
      }

      //Clear the message input
      setMessageInput("");

      //Handle attachments
      for (const queuedFile of queuedFileArray) {
        //Convert the file to a message
        const messageLocalID = generateMessageLocalID();
        const message: MessageItem = {
          itemType: ConversationItemType.Message,
          localID: messageLocalID,
          serverID: undefined,
          guid: undefined,
          chatGuid: !conversation.localOnly ? conversation.guid : undefined,
          chatLocalID: conversation.localID,
          date: new Date(),

          text: undefined,
          subject: undefined,
          sender: undefined,
          attachments: [
            {
              localID: queuedFile.id,
              name: queuedFile.file.name,
              type: queuedFile.file.type,
              size: queuedFile.file.size,
              data: queuedFile.file,
            },
          ],
          stickers: [],
          tapbacks: [],
          sendStyle: undefined,
          status: MessageStatusCode.Unconfirmed,
          statusDate: undefined,
          error: undefined,
          progress: -1, //Show indeterminate progress by default for attachments
        };

        //Send the file
        const progress = ConnectionManager.sendFile(
          conversationTarget,
          queuedFile.file
        );

        //Subscribe to the file upload progress
        registerUploadProgress(messageLocalID, progress);

        //Keep track of the messages
        addedItems.push(message);
      }

      //Clear attachments
      setAttachmentInput([]);

      if (addedItems.length > 0) {
        //Notify message listeners
        ConnectionManager.messageUpdateEmitter.notify(addedItems);
        messageSubmitEmitter.current.notify();

        //Play a message sound
        playSoundMessageOut();
      }
    },
    [
      displayState,
      conversation,
      registerUploadProgress,
      setMessageInput,
      setAttachmentInput,
      applyMessageError,
    ]
  );

  const startCall = useCallback(async () => {
    await ConnectionManager.initiateFaceTimeCall(conversation.members);
  }, [conversation]);

  let body: React.ReactNode;
  if (displayState.type === DisplayType.Messages) {
    body = (
      <MessageList
        conversation={conversation}
        items={displayState.messages}
        messageSubmitEmitter={messageSubmitEmitter.current}
        showHistoryLoader={historyLoadState === HistoryLoadState.Loading}
        onRequestHistory={requestHistory}
      />
    );
  } else if (displayState.type === DisplayType.Loading) {
    body = (
      <Stack height="100%" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  } else if (displayState.type === DisplayType.Error) {
    body = (
      <Stack height="100%" alignItems="center" justifyContent="center">
        <Typography color="textSecondary" gutterBottom>
          Couldn&apos;t load this conversation
        </Typography>
        <Button onClick={requestMessages}>Retry</Button>
      </Stack>
    );
  }

  const cancelDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer) return;
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!event.dataTransfer) return;

      //Add the files
      const files = [...event.dataTransfer.files].map((file): QueuedFile => {
        return { id: generateAttachmentLocalID(), file: file };
      });

      setAttachmentInput((attachmentInput) => {
        return attachmentInput.concat(...files);
      });
    },
    [setAttachmentInput]
  );

  return (
    <DetailFrame
      title={conversationTitle}
      showCall={faceTimeSupported}
      onClickCall={startCall}
    >
      <Stack
        flexGrow={1}
        minHeight={0}
        onDragEnter={cancelDrag}
        onDragLeave={cancelDrag}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Stack flexGrow={1} minHeight={0}>
          {body}
        </Stack>

        <Box width="100%" padding={2}>
          <MessageInput
            placeholder={mapServiceName(conversation.service)}
            message={messageInput}
            onMessageChange={setMessageInput}
            attachments={attachmentInput}
            onAttachmentAdd={addAttachment}
            onAttachmentRemove={removeAttachment}
            onMessageSubmit={submitInput}
          />
        </Box>
      </Stack>
    </DetailFrame>
  );
}

enum DisplayType {
  Loading,
  Error,
  Messages,
}

type DisplayStateMessages = {
  type: DisplayType.Messages;
  messages: ConversationItem[];
};

type DisplayState =
  | {
      type: DisplayType.Loading | DisplayType.Error;
    }
  | DisplayStateMessages;

enum HistoryLoadState {
  Idle,
  Loading,
  Complete,
}
