import React from "react";
import { alpha, Avatar, ButtonBase, Typography } from "@mui/material";

/**
 * A row entry to send a message directly to a specified address
 */
export default function DetailCreateDirectSendButton(props: {
  address: string;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={props.onClick}
      sx={{
        width: "100%",
        padding: "8px 0",
        transition: (theme) =>
          theme.transitions.create(
            ["background-color", "box-shadow", "border"],
            {
              duration: theme.transitions.duration.short,
            }
          ),
        borderRadius: 1,
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        "&:hover": {
          backgroundColor: (theme) =>
            alpha(
              theme.palette.text.primary,
              theme.palette.action.hoverOpacity
            ),
        },
      }}
    >
      <Avatar
        sx={{
          backgroundColor: "primary.main",
          marginRight: 2,
        }}
      />
      <Typography>
        Send to <b>{props.address}</b>
      </Typography>
    </ButtonBase>
  );
}
