import React from "react";
import QueuedAttachment, { QueuedAttachmentProps } from "./QueuedAttachment";
import { useBlobURL } from "shared/util/hookUtils";
import { styled } from "@mui/material";

const AttachmentImage = styled("img")(({ theme }) => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: theme.shape.borderRadius,
}));

export function QueuedAttachmentImage(props: {
  queueData: QueuedAttachmentProps;
}) {
  const imageURL = useBlobURL(props.queueData.file, props.queueData.file.type);

  return (
    <QueuedAttachment queueData={props.queueData}>
      <AttachmentImage src={imageURL} alt="" />
    </QueuedAttachment>
  );
}
