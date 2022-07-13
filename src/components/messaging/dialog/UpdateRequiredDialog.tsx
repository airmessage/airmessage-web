import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Typography,
} from "@mui/material";
import React from "react";

/**
 * A dialog that warns the user to check their server for updates
 */
export default function UpdateRequiredDialog(props: {
  isOpen: boolean;
  onDismiss: () => void;
}) {
  return (
    <Dialog open={props.isOpen} onClose={props.onDismiss} fullWidth>
      <DialogTitle>Your server needs to be updated</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography paragraph>
            You&apos;re running an unsupported version of AirMessage Server.
          </Typography>

          <Typography paragraph>
            Unsupported versions of AirMessage Server may contain security or
            stability issues, and will start refusing connections late January.
          </Typography>

          <Typography paragraph>
            Please install the latest version of AirMessage Server from{" "}
            <Link href="https://airmessage.org" target="_blank">
              airmessage.org
            </Link>{" "}
            on your Mac.
          </Typography>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}
