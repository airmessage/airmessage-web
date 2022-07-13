import React from "react";
import { InsertDriveFileRounded } from "@mui/icons-material";
import QueuedAttachment, { QueuedAttachmentProps } from "./QueuedAttachment";
import { Box } from "@mui/material";

export default function QueuedAttachmentGeneric(props: {
  queueData: QueuedAttachmentProps;
}) {
  return (
    <QueuedAttachment queueData={props.queueData}>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: 1,

          backgroundColor: "background.default",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <InsertDriveFileRounded />
      </Box>
    </QueuedAttachment>
  );
}
