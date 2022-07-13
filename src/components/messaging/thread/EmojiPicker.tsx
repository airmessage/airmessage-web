import React, { useState } from "react";
import Picker, { IEmojiData } from "emoji-picker-react";

const EmojiPicker = (props: {
  onEmojiClick: (event: React.MouseEvent, data: IEmojiData) => void;
}) => {
  return (
    <Picker
      pickerStyle={{ position: "absolute", bottom: "79px", right: "58px" }}
      onEmojiClick={props.onEmojiClick}
    />
  );
};

export default EmojiPicker;
