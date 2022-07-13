import React, { useEffect, useState } from "react";

import * as ConversationUtils from "../../../util/conversationUtils";
import { isConversationPreviewMessage } from "../../../util/conversationUtils";

import {
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
  TypographyProps,
} from "@mui/material";

import { Conversation, ConversationPreview } from "../../../data/blocks";
import { appleSendStyleBubbleInvisibleInk } from "../../../data/appleConstants";
import { getLastUpdateStatusTime } from "../../../util/dateUtils";
import GroupAvatar from "./GroupAvatar";
import { ConversationPreviewType } from "../../../data/stateCodes";

export default function ListConversation(props: {
  conversation: Conversation;
  selected?: boolean;
  highlighted?: boolean;
  onSelected: () => void;
}) {
  //Getting the conversation title
  const [title, setConversationTitle] = useState("");

  useEffect(() => {
    //Updating the conversation's name if it has one
    if (props.conversation.name) {
      setConversationTitle(props.conversation.name);
      return;
    }

    //Building the conversation title
    setConversationTitle(
      ConversationUtils.getFallbackTitle(props.conversation)
    );
    ConversationUtils.getMemberTitle(props.conversation.members).then((title) =>
      setConversationTitle(title)
    );
  }, [setConversationTitle, props.conversation]);

  const primaryStyle: TypographyProps = props.highlighted
    ? {
        color: "primary",
        sx: {
          fontSize: "1rem",
          fontWeight: "bold",
        },
      }
    : {
        sx: {
          fontSize: "1rem",
          fontWeight: 500,
        },
      };

  const secondaryStyle: TypographyProps = props.highlighted
    ? {
        color: "textPrimary",
        sx: {
          fontWeight: "bold",
        },
      }
    : {};

  return (
    <ListItemButton
      key={props.conversation.localID}
      onClick={props.onSelected}
      selected={props.selected}
      sx={{
        marginX: 1,
        marginY: 0.5,
        borderRadius: 1,
        paddingX: 1.5,
        paddingY: 0.5,
        "&&.Mui-selected, &&.Mui-selected:hover": {
          backgroundColor: "action.selected",
        },
        "&&:hover": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <ListItemAvatar>
        <GroupAvatar members={props.conversation.members} />
      </ListItemAvatar>
      <ListItemText
        sx={{
          ".MuiTypography-root": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
        primary={title}
        primaryTypographyProps={primaryStyle}
        secondary={previewString(props.conversation.preview)}
        secondaryTypographyProps={secondaryStyle}
      />
      <Typography
        sx={{
          alignSelf: "flex-start",
          paddingTop: 1,
          paddingLeft: 2,
          flexShrink: 0,
        }}
        variant="body2"
        color="textSecondary"
      >
        {getLastUpdateStatusTime(props.conversation.preview.date)}
      </Typography>
    </ListItemButton>
  );
}

function previewString(preview: ConversationPreview): string {
  if (isConversationPreviewMessage(preview)) {
    if (preview.sendStyle === appleSendStyleBubbleInvisibleInk)
      return "Message sent with Invisible Ink";
    else if (preview.text) return preview.text;
    else if (preview.attachments.length) {
      if (preview.attachments.length === 1) {
        return ConversationUtils.mimeTypeToPreview(preview.attachments[0]);
      } else {
        return `${preview.attachments.length} attachments`;
      }
    }
  } else if (preview.type === ConversationPreviewType.ChatCreation) {
    return "New conversation created";
  }

  return "Unknown";
}
