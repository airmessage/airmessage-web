import React, { useCallback, useContext } from "react";
import LoginContext from "shared/components/LoginContext";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

/**
 * A dialog that prompts the user to sign out
 */
export default function SignOutDialog(props: {
  isOpen: boolean;
  onDismiss: VoidFunction;
}) {
  const onDismiss = props.onDismiss;
  const signOut = useContext(LoginContext).signOut;
  const onConfirm = useCallback(() => {
    //Dismissing the dialog
    onDismiss();

    //Signing out
    signOut();
  }, [onDismiss, signOut]);

  return (
    <Dialog open={props.isOpen} onClose={props.onDismiss}>
      <DialogTitle>Sign out of AirMessage?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You won&apos;t be able to send or receive any messages from this
          computer
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onDismiss} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary" autoFocus>
          Sign out
        </Button>
      </DialogActions>
    </Dialog>
  );
}
