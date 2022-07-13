import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  linearProgressClasses,
  Stack,
  Typography,
} from "@mui/material";
import Markdown from "shared/components/Markdown";
import ServerUpdateData from "shared/data/serverUpdateData";
import * as ConnectionManager from "../../../connection/connectionManager";
import { compareVersions } from "shared/util/versionUtils";
import {
  ConnectionErrorCode,
  RemoteUpdateErrorCode,
} from "shared/data/stateCodes";
import {
  ConnectionListener,
  RemoteUpdateListener,
} from "../../../connection/connectionManager";
import { remoteUpdateErrorCodeToDisplay } from "shared/util/languageUtils";

/**
 * A dialog that allows the user to update their server remotely
 */
export default function RemoteUpdateDialog(props: {
  isOpen: boolean;
  onDismiss: () => void;
  update: ServerUpdateData;
}) {
  const [isInstalling, setInstalling] = useState(false);
  const installTimeout = useRef<any | undefined>(undefined);
  const [errorDetails, setErrorDetails] = useState<
    { message: string; details?: string } | undefined
  >(undefined);

  const remoteInstallable = props.update.remoteInstallable;

  //Check if this server update introduces a newer server protocol than we support
  const protocolCompatible = useMemo((): boolean => {
    return (
      compareVersions(
        ConnectionManager.targetCommVer,
        props.update.protocolRequirement
      ) >= 0
    );
  }, [props.update.protocolRequirement]);

  const updateNotice = useMemo((): string => {
    if (!remoteInstallable) {
      return `This server update cannot be installed remotely.
			Please check AirMessage Server on ${ConnectionManager.getServerComputerName()} for details.`;
    } else if (!protocolCompatible) {
      return `This server update requires a newer version of AirMessage for web than is currently running.
			Please refresh the webpage to check for updates.`;
    } else {
      return `This will install the latest version of AirMessage Server on ${ConnectionManager.getServerComputerName()}.
			You will lose access to messaging functionality while the update installs.
			In case the installation fails, please make sure you have desktop access to this computer before installing.`;
    }
  }, [remoteInstallable, protocolCompatible]);

  //Installs a remote update
  const installUpdate = useCallback(() => {
    //Install the update
    setInstalling(true);
    setErrorDetails(undefined);
    ConnectionManager.installRemoteUpdate(props.update.id);

    //Start the installation timeout
    installTimeout.current = setTimeout(() => {
      installTimeout.current = undefined;

      //Show an error snackbar
      setErrorDetails({
        message: remoteUpdateErrorCodeToDisplay(RemoteUpdateErrorCode.Timeout),
      });
    }, 10 * 1000);
  }, [setInstalling, setErrorDetails, props.update.id]);

  //Register for update events
  const propsOnDismiss = props.onDismiss;
  useEffect(() => {
    const connectionListener: ConnectionListener = {
      onClose(reason: ConnectionErrorCode): void {
        //Close the dialog
        propsOnDismiss();
      },
      onConnecting(): void {},
      onOpen(): void {},
    };
    ConnectionManager.addConnectionListener(connectionListener);

    const updateListener: RemoteUpdateListener = {
      onInitiate(): void {
        //Cancel the timeout
        if (installTimeout.current !== undefined) {
          clearTimeout(installTimeout.current);
          installTimeout.current = undefined;
        }
      },

      onError(code: RemoteUpdateErrorCode, details?: string): void {
        //Set the update as not installing
        setInstalling(false);

        //Show an error snackbar
        setErrorDetails({
          message: remoteUpdateErrorCodeToDisplay(code),
          details,
        });
      },
    };
    ConnectionManager.addRemoteUpdateListener(updateListener);

    return () => {
      ConnectionManager.removeConnectionListener(connectionListener);
      ConnectionManager.removeRemoteUpdateListener(updateListener);
    };
  }, [propsOnDismiss, setInstalling, setErrorDetails]);

  return (
    <Dialog open={props.isOpen} onClose={props.onDismiss} fullWidth>
      <DialogTitle>Server update</DialogTitle>
      <DialogContent dividers>
        <Stack>
          <Typography variant="body1">
            AirMessage Server {props.update.version} is now available - you have{" "}
            {ConnectionManager.getServerSoftwareVersion()}
          </Typography>

          <Box color="text.secondary" sx={{ marginTop: 2, marginBottom: 2 }}>
            <Markdown markdown={props.update.notes} />
          </Box>

          <Typography variant="body1" paragraph>
            {updateNotice}
          </Typography>

          {!isInstalling ? (
            <>
              {remoteInstallable &&
                (protocolCompatible ? (
                  <Button
                    sx={{ alignSelf: "flex-end" }}
                    variant="contained"
                    onClick={installUpdate}
                  >
                    Install update
                  </Button>
                ) : (
                  <Button
                    sx={{ alignSelf: "flex-end" }}
                    variant="contained"
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </Button>
                ))}
            </>
          ) : (
            <>
              <Box sx={{ paddingBottom: 2, paddingTop: 2 }}>
                <Typography variant="body1">
                  Installing update&#8230;
                </Typography>
                <LinearProgress
                  sx={{
                    marginTop: 1,
                    borderRadius: 8,
                    [`& .${linearProgressClasses.bar}`]: {
                      borderRadius: 8,
                    },
                  }}
                />
              </Box>
            </>
          )}

          {errorDetails !== undefined && (
            <Alert severity="error" sx={{ marginTop: 2 }}>
              <AlertTitle>Failed to install update</AlertTitle>
              {errorDetails.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
