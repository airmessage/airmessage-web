import React, { useCallback } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export default function FaceTimeLinkDialog(props: {
  isOpen: boolean;
  onDismiss: () => void;
  link: string;
}) {
  const propsLink = props.link;
  const propsOnDismiss = props.onDismiss;
  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(propsLink);
    propsOnDismiss();
  }, [propsLink, propsOnDismiss]);

  return (
    <Dialog open={props.isOpen} onClose={props.onDismiss}>
      <DialogTitle>FaceTime link</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.link}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onDismiss} color="primary">
          Cancel
        </Button>
        <Button onClick={copyLink} color="primary" autoFocus>
          Copy
        </Button>
      </DialogActions>
    </Dialog>
  );
}
