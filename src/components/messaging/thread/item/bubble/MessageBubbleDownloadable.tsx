import React, { useCallback, useContext, useEffect, useState } from "react";
import MessageBubbleWrapper from "shared/components/messaging/thread/item/bubble/MessageBubbleWrapper";
import { StickerItem, TapbackItem } from "shared/data/blocks";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { getFlowBorderRadius, MessagePartFlow } from "shared/util/messageFlow";
import FileDownloadResult from "shared/data/fileDownloadResult";
import { SnackbarContext } from "shared/components/control/SnackbarProvider";
import { mimeTypeToPreview } from "shared/util/conversationUtils";
import { GetAppRounded } from "@mui/icons-material";
import * as ConnectionManager from "shared/connection/connectionManager";
import { AttachmentRequestErrorCode } from "shared/data/stateCodes";
import { useUnsubscribeContainer } from "shared/util/hookUtils";
import { installCancellablePromise } from "shared/util/cancellablePromise";
import {
  attachmentRequestErrorCodeToDisplay,
  formatFileSize,
} from "shared/util/languageUtils";
import PaletteSpecifier, {
  accessPaletteColor,
} from "shared/data/paletteSpecifier";

const DownloadableButton = styled(ButtonBase, {
  shouldForwardProp: (prop) =>
    typeof prop !== "string" ||
    !["amColor", "amBackgroundColor", "amBorderRadius"].includes(prop),
})<{
  amColor: PaletteSpecifier;
  amBackgroundColor: PaletteSpecifier;
}>(({ amColor, amBackgroundColor, theme }) => ({
  color: accessPaletteColor(theme.palette, amColor),
  backgroundColor: accessPaletteColor(theme.palette, amBackgroundColor),

  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  paddingTop: theme.spacing(0.75),
  paddingBottom: theme.spacing(0.75),

  overflowWrap: "break-word",
  wordBreak: "break-word",
  hyphens: "auto",

  display: "flex",
  flexDirection: "row",
  alignItems: "center",
}));

const DownloadableIcon = styled(Box)({
  flexShrink: 0,
  width: 36,
  height: 36,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

/**
 * A message bubble that allows the user to
 * download an attachment file
 */
export default function MessageBubbleDownloadable(props: {
  flow: MessagePartFlow;
  data: Blob | undefined;
  name: string | undefined;
  type: string;
  size: number;
  guid: string;
  onDataAvailable: (result: FileDownloadResult) => void;
  onDataClicked: (data: Blob) => void;
  stickers: StickerItem[];
  tapbacks: TapbackItem[];
}) {
  const { data: fileData, onDataClicked, onDataAvailable } = props;

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [sizeAvailable, setSizeAvailable] = useState<number>(props.size);
  const [sizeDownloaded, setSizeDownloaded] = useState<number | undefined>(
    undefined
  );

  const displaySnackbar = useContext(SnackbarContext);

  //Reset state values when the attachment changes
  useEffect(() => {
    setIsDownloading(false);
    setSizeAvailable(props.size);
    setSizeDownloaded(undefined);
  }, [
    props.guid,
    props.size,
    setIsDownloading,
    setSizeAvailable,
    setSizeDownloaded,
  ]);

  //Display the file name if it is available, otherwise just display the file type
  const nameDisplay = props.name ?? mimeTypeToPreview(props.type);

  //Abandon downloads when the GUID changes
  const attachmentSubscriptionContainer = useUnsubscribeContainer([props.guid]);

  const onClick = useCallback(() => {
    //If data is already available, notify the parent
    //that this bubble was clicked
    if (fileData !== undefined) {
      onDataClicked(fileData);
      return;
    }

    setIsDownloading(true);

    //Send the request
    const downloadProgress = ConnectionManager.fetchAttachment(props.guid);

    downloadProgress.emitter.subscribe((progressEvent) => {
      if (progressEvent.type === "size") {
        setSizeAvailable(progressEvent.value);
      } else {
        setSizeDownloaded(progressEvent.value);
      }
    }, attachmentSubscriptionContainer);

    installCancellablePromise(
      downloadProgress.promise,
      attachmentSubscriptionContainer
    )
      .then((fileData) => {
        //Notify the parent
        onDataAvailable(fileData);
      })
      .catch((error: AttachmentRequestErrorCode) => {
        //Notify the user with a snackbar
        displaySnackbar({
          message:
            "Failed to download attachment: " +
            attachmentRequestErrorCodeToDisplay(error),
        });
      })
      .finally(() => {
        //Reset the state
        setIsDownloading(false);
        setSizeDownloaded(undefined);
      });
  }, [
    props.guid,
    fileData,
    onDataClicked,
    onDataAvailable,
    setIsDownloading,
    setSizeAvailable,
    setSizeDownloaded,
    displaySnackbar,
    attachmentSubscriptionContainer,
  ]);

  return (
    <MessageBubbleWrapper
      flow={props.flow}
      stickers={props.stickers}
      tapbacks={props.tapbacks}
      maxWidth="60%"
    >
      <DownloadableButton
        style={{
          borderRadius: getFlowBorderRadius(props.flow),
        }}
        amColor={props.flow.color}
        amBackgroundColor={props.flow.backgroundColor}
        disabled={isDownloading}
        onClick={onClick}
      >
        {/* Icon or progress circle */}
        <DownloadableIcon>
          {isDownloading ? (
            <CircularProgress
              sx={{ color: props.flow.color }}
              size={24}
              variant={
                sizeDownloaded === undefined ? "indeterminate" : "determinate"
              }
              value={((sizeDownloaded ?? 0) / sizeAvailable) * 100}
            />
          ) : (
            <GetAppRounded />
          )}
        </DownloadableIcon>

        {/* Attachment description */}
        <Stack alignItems="start" marginLeft={1.5}>
          <Typography variant="body2" textAlign="start">
            {nameDisplay}
          </Typography>
          <Typography sx={{ opacity: 0.8 }} variant="body2" textAlign="start">
            {isDownloading
              ? `${formatFileSize(sizeDownloaded ?? 0)} of ${formatFileSize(
                  sizeAvailable
                )}`
              : `${formatFileSize(sizeAvailable)} • Click to download`}
          </Typography>
        </Stack>
      </DownloadableButton>
    </MessageBubbleWrapper>
  );
}
