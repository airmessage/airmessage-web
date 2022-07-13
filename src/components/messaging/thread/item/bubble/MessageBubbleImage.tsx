import React, { useCallback, useState } from "react";
import MessageBubbleWrapper from "shared/components/messaging/thread/item/bubble/MessageBubbleWrapper";
import { StickerItem, TapbackItem } from "shared/data/blocks";
import {
  Backdrop,
  Box,
  ButtonBase,
  IconButton,
  styled,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { getFlowBorderRadius, MessagePartFlow } from "shared/util/messageFlow";
import { useBlobURL } from "shared/util/hookUtils";
import { createTheme, Theme, ThemeProvider } from "@mui/material/styles";
import { downloadURL } from "shared/util/browserUtils";
import { ArrowBack, SaveAlt } from "@mui/icons-material";

const ImagePreview = styled("img")(({ theme }) => ({
  backgroundColor: theme.palette.background.sidebar,
  maxWidth: "100%",
}));

const lightboxTheme = createTheme({
  palette: {
    mode: "dark",
    messageIncoming: undefined,
    messageOutgoing: undefined,
    messageOutgoingTextMessage: undefined,
  },
});

/**
 * A message bubble that displays an image thumbnail,
 * and allows the user to enlarge the image by
 * clicking on it
 */
export default function MessageBubbleImage(props: {
  flow: MessagePartFlow;
  data: ArrayBuffer | Blob;
  name: string;
  type: string;
  stickers: StickerItem[];
  tapbacks: TapbackItem[];
}) {
  const imageURL = useBlobURL(props.data);
  const [previewOpen, setPreviewOpen] = useState(false);

  /**
   * Saves the attachment file to the user's downloads
   */
  const downloadAttachmentFile = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      //So that we don't dismiss the backdrop
      event.stopPropagation();

      if (imageURL === undefined) return;
      downloadURL(imageURL, props.type, props.name);
    },
    [imageURL, props.type, props.name]
  );

  const borderRadius = getFlowBorderRadius(props.flow);

  return (
    <>
      <ThemeProvider theme={lightboxTheme}>
        <Backdrop
          sx={{
            zIndex: (theme: Theme) => theme.zIndex.modal,
            flexDirection: "column",
            alignItems: "stretch",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
          }}
          open={previewOpen}
          onClick={() => setPreviewOpen(false)}
        >
          <Toolbar sx={{ flexShrink: 0 }}>
            <IconButton edge="start">
              <ArrowBack />
            </IconButton>

            <Typography flexGrow={1} variant="h6" color="textPrimary">
              {props.name}
            </Typography>

            <Tooltip title="Save">
              <IconButton onClick={downloadAttachmentFile}>
                <SaveAlt />
              </IconButton>
            </Tooltip>
          </Toolbar>

          <Box flexGrow={1} paddingLeft={8} paddingRight={8} paddingBottom={8}>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                backgroundImage: `url("${imageURL}")`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "contain",
              }}
            />
          </Box>
        </Backdrop>
      </ThemeProvider>

      <MessageBubbleWrapper
        flow={props.flow}
        stickers={props.stickers}
        tapbacks={props.tapbacks}
        maxWidth={400}
      >
        <ButtonBase
          style={{ borderRadius }}
          onClick={() => setPreviewOpen(true)}
        >
          <ImagePreview style={{ borderRadius }} src={imageURL} alt="" />
        </ButtonBase>
      </MessageBubbleWrapper>
    </>
  );
}
