import React, { ChangeEvent, useCallback, useState } from "react";
import { Box, IconButton, InputBase, Stack } from "@mui/material";
import PushIcon from "../../icon/PushIcon";
import { QueuedFile } from "../../../data/blocks";
import { QueuedAttachmentImage } from "./queue/QueuedAttachmentImage";
import QueuedAttachmentGeneric from "./queue/QueuedAttachmentGeneric";
import { QueuedAttachmentProps } from "./queue/QueuedAttachment";
import EmojiPicker from "./EmojiPicker";
import { IEmojiData } from "emoji-picker-react";

interface Props {
  placeholder: string;
  message: string;
  attachments: QueuedFile[];
  onMessageChange: (value: string) => void;
  onMessageSubmit: (message: string, attachments: QueuedFile[]) => void;
  onAttachmentAdd: (files: File[]) => void;
  onAttachmentRemove: (value: QueuedFile) => void;
}

export default function MessageInput(props: Props) {
  const {
    onMessageChange: propsOnMessageChange,
    onMessageSubmit: propsOnMessageSubmit,
    message: propsMessage,
    attachments: propsAttachments,
    onAttachmentAdd: propsOnAttachmentAdd,
  } = props;
  const [chosenEmoji, setChosenEmoji] = useState<IEmojiData | null>(null);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      propsOnMessageChange(event.target.value);
    },
    [propsOnMessageChange]
  );

  const submitInput = useCallback(() => {
    propsOnMessageSubmit(propsMessage, propsAttachments);
  }, [propsOnMessageSubmit, propsMessage, propsAttachments]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        submitInput();
      }
    },
    [submitInput]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLElement>) => {
      propsOnAttachmentAdd(Array.from(event.clipboardData.files));
    },
    [propsOnAttachmentAdd]
  );

  const onEmojiClick = (event: React.MouseEvent, emojiObject: IEmojiData) => {
    setChosenEmoji(emojiObject);
  };

  return (
    <Box
      sx={{
        borderRadius: 5,
        backgroundColor: "messageIncoming.main",
        overflow: "hidden",
        maxWidth: 1000,
        marginX: "auto",
      }}
    >
      {props.attachments.length > 0 && (
        <Stack
          sx={{
            overflowX: "scroll",
            overflowY: "hidden",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },

            paddingX: "16px",
            paddingTop: "16px",
          }}
          direction="row"
          gap={2}
        >
          {props.attachments.map((file) => {
            const queueData: QueuedAttachmentProps = {
              file: file.file,
              onRemove: () => props.onAttachmentRemove(file),
            };

            let component: React.ReactNode;
            if (file.file.type.startsWith("image/")) {
              component = (
                <QueuedAttachmentImage key={file.id} queueData={queueData} />
              );
            } else {
              component = (
                <QueuedAttachmentGeneric key={file.id} queueData={queueData} />
              );
            }

            return component;
          })}
        </Stack>
      )}

      <Stack direction="row">
        <InputBase
          sx={{
            typography: "body2",
            paddingX: "16px",
            paddingY: "10px",
          }}
          maxRows="5"
          multiline
          fullWidth
          autoFocus
          placeholder={props.placeholder}
          value={props.message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        {/* <EmojiPicker onEmojiClick={onEmojiClick} /> */}
        <IconButton
          sx={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            alignSelf: "flex-end",
          }}
          size="small"
          color="primary"
          disabled={
            props.message.trim() === "" && props.attachments.length === 0
          }
          onClick={submitInput}
        >
          <PushIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
