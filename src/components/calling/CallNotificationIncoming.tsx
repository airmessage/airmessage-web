import React from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";

export default function CallNotificationIncoming(props: {
  caller?: string;
  onDecline?: VoidFunction;
  onAccept?: VoidFunction;
  loading?: boolean;
}) {
  return (
    <Paper
      sx={{
        padding: 2,
        width: 400,
        boxSizing: "border-box",
      }}
      elevation={3}
    >
      <Stack direction="column" alignItems="stretch" spacing={2}>
        <Typography>Incoming FaceTime call from {props.caller}</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            sx={{ flexBasis: 0, flexGrow: 1 }}
            variant="contained"
            color="error"
            disabled={props.loading}
            onClick={props.onDecline}
          >
            Decline
          </Button>
          <Button
            sx={{ flexBasis: 0, flexGrow: 1 }}
            variant="contained"
            color="success"
            disabled={props.loading}
            onClick={props.onAccept}
          >
            Accept
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
