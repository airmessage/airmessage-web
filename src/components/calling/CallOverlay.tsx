import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  ThemeProvider,
} from "@mui/material";
import { createTheme, useTheme } from "@mui/material/styles";
import CallNotificationIncoming from "shared/components/calling/CallNotificationIncoming";
import CallNotificationOutgoing from "shared/components/calling/CallNotificationOutgoing";
import * as ConnectionManager from "shared/connection/connectionManager";
import { getMemberTitle } from "shared/util/conversationUtils";
import { buildListString } from "shared/util/languageUtils";
import CallEvent from "shared/data/callEvent";
import { SnackbarContext } from "shared/components/control/SnackbarProvider";
import { getNotificationUtils } from "shared/interface/notification/notificationUtils";

export default function CallOverlay() {
  const displaySnackbar = useContext(SnackbarContext);
  const existingTheme = useTheme();
  const existingThemeMode = existingTheme.palette.mode;

  //Invert theme
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: existingThemeMode === "light" ? "dark" : "light",
        messageIncoming: undefined,
        messageOutgoing: undefined,
        messageOutgoingTextMessage: undefined,
      },
    });
  }, [existingThemeMode]);

  //Subscribe to incoming caller updates
  const [incomingCaller, setIncomingCaller] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    ConnectionManager.incomingCallerEmitter.subscribe((caller) => {
      //Update the caller state
      setIncomingCaller(caller);

      //Display a notification
      getNotificationUtils().updateCallerNotification(caller);
    });
    return () =>
      ConnectionManager.incomingCallerEmitter.unsubscribe(setIncomingCaller);
  }, [setIncomingCaller]);

  //Subscribe to outgoing callee updates
  const [outgoingCallee, setOutgoingCallee] = useState<string[] | undefined>(
    undefined
  );
  useEffect(() => {
    ConnectionManager.outgoingCalleeEmitter.subscribe(setOutgoingCallee);
    return () =>
      ConnectionManager.outgoingCalleeEmitter.unsubscribe(setOutgoingCallee);
  }, [setOutgoingCallee]);

  const [outgoingCalleeReadable, setOutgoingCalleeReadable] =
    useState<string>("");
  useEffect(() => {
    //Ignore if there is no outgoing callee
    if (outgoingCallee === undefined) {
      setOutgoingCalleeReadable("");
      return;
    }

    //Set a quick title by joining the member's addresses
    setOutgoingCalleeReadable(buildListString(outgoingCallee));

    //Look up the member's names to build the title
    let invalidated = false;
    getMemberTitle(outgoingCallee).then((title) => {
      if (invalidated) return;
      setOutgoingCalleeReadable(title);
    });

    return () => {
      invalidated = true;
    };
  }, [outgoingCallee, setOutgoingCalleeReadable]);

  //Set to true between the time that we have responded to an incoming call, and the server has yet to answer our message
  const [incomingCallLoading, setIncomingCallLoading] = useState(false);
  useEffect(() => {
    //When the incoming caller changes, reset the loading state
    setIncomingCallLoading(false);
  }, [incomingCaller, setIncomingCallLoading]);

  const declineIncomingCall = useCallback(() => {
    setIncomingCallLoading(true);
    ConnectionManager.handleIncomingFaceTimeCall(incomingCaller!, false);
  }, [setIncomingCallLoading, incomingCaller]);

  const acceptIncomingCall = useCallback(() => {
    setIncomingCallLoading(true);
    ConnectionManager.handleIncomingFaceTimeCall(incomingCaller!, true);
  }, [setIncomingCallLoading, incomingCaller]);

  const [outgoingCallLoading, setOutgoingCallLoading] = useState(false);
  useEffect(() => {
    //When the outgoing callee changes, reset the loading state
    setOutgoingCallLoading(false);
  }, [outgoingCallee, setOutgoingCallLoading]);

  const cancelOutgoingCall = useCallback(() => {
    setOutgoingCallLoading(true);
    ConnectionManager.dropFaceTimeCallServer();
  }, [setOutgoingCallLoading]);

  const [errorDetailsDisplay, setErrorDetailsDisplay] = useState<
    string | undefined
  >(undefined);

  //Subscribe to event updates
  useEffect(() => {
    const listener = (event: CallEvent) => {
      switch (event.type) {
        case "outgoingAccepted":
        case "incomingHandled":
          //Open the FaceTime link in a new tab
          window.open(event.faceTimeLink, "_blank");
          break;
        case "outgoingError":
        case "incomingHandleError":
          //Let the user know that something went wrong
          displaySnackbar({
            message: "Your call couldn't be completed",
            action: (
              <Button
                onClick={() => setErrorDetailsDisplay(event.errorDetails)}
              >
                Details
              </Button>
            ),
          });
          break;
      }
    };

    ConnectionManager.callEventEmitter.subscribe(listener);
    return () => ConnectionManager.callEventEmitter.unsubscribe(listener);
  }, [displaySnackbar, setErrorDetailsDisplay]);

  return (
    <>
      <ThemeProvider theme={theme}>
        <Stack
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: 1,
          }}
          spacing={1}
        >
          {incomingCaller !== undefined && (
            <CallNotificationIncoming
              caller={incomingCaller}
              onDecline={declineIncomingCall}
              onAccept={acceptIncomingCall}
              loading={incomingCallLoading}
            />
          )}

          {outgoingCallee !== undefined && (
            <CallNotificationOutgoing
              callee={outgoingCalleeReadable}
              onCancel={cancelOutgoingCall}
              loading={outgoingCallLoading}
            />
          )}
        </Stack>
      </ThemeProvider>

      <Dialog
        open={errorDetailsDisplay !== undefined}
        onClose={() => setErrorDetailsDisplay(undefined)}
      >
        <DialogTitle>Call error details</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorDetailsDisplay}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setErrorDetailsDisplay(undefined)}
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
