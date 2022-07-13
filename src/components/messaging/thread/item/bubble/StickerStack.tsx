import React from "react";
import { StickerItem } from "shared/data/blocks";
import { Box, BoxProps, styled } from "@mui/material";
import { useBlobURL } from "shared/util/hookUtils";

const BoxStackContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "peek",
})<{ peek: boolean } & BoxProps>(({ peek, theme }) => ({
  zIndex: 2,
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none",

  transition: theme.transitions.create(["opacity"]),
  opacity: peek ? 0.05 : 1,
}));
const BoxStackEntry = styled("img")({
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 100,
  maxHeight: 100,
});

/**
 * A stack of stickers to be overlayed on
 * top of a message bubble
 * @constructor
 */

export default function StickerStack(props: {
  stickers: StickerItem[];
  peek?: boolean;
}) {
  return (
    <BoxStackContainer peek={!!props.peek}>
      {props.stickers.map((sticker, index) => (
        <StickerStackEntry key={index} sticker={sticker} />
      ))}
    </BoxStackContainer>
  );
}

function StickerStackEntry(props: { sticker: StickerItem }) {
  const imageURL = useBlobURL(props.sticker.data, props.sticker.dataType);

  return <BoxStackEntry src={imageURL} alt="" />;
}
