import React from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";

export default function CallNotificationOutgoing(props: {
  callee?: string;
  onCancel?: VoidFunction;
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
        <Typography>Calling {props.callee} on FaceTime&#8230;</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            sx={{ flexBasis: 0, flexGrow: 1 }}
            variant="contained"
            color="error"
            disabled={props.loading}
            onClick={props.onCancel}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
