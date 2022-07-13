import React from "react";
import BorderedCloseIcon from "../../../icon/BorderedCloseIcon";
import { Box, IconButton, Tooltip } from "@mui/material";

export interface QueuedAttachmentProps {
  file: File;
  onRemove: () => void;
}

export default function QueuedAttachment(props: {
  children: React.ReactNode;
  queueData: QueuedAttachmentProps;
}) {
  return (
    <Tooltip title={props.queueData.file.name}>
      <Box
        sx={{
          width: 64,
          height: 64,
          position: "relative",
        }}
      >
        {props.children}

        <IconButton
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            transform: "translate(50%, -50%)",
          }}
          onClick={props.queueData.onRemove}
        >
          <BorderedCloseIcon />
        </IconButton>
      </Box>
    </Tooltip>
  );
}
