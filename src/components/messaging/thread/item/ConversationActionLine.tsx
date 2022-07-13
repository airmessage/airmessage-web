import React from "react";
import { Typography } from "@mui/material";

export default function ConversationActionLine(props: {
  children?: React.ReactNode;
}) {
  return (
    <Typography
      paddingTop={3}
      paddingBottom={1}
      paddingX={1}
      textAlign="center"
      variant="body2"
      color="textSecondary"
    >
      {props.children}
    </Typography>
  );
}
