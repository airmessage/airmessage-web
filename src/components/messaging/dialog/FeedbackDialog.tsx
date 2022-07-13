import React, { useCallback } from "react";
import { getPlatformUtils } from "shared/interface/platform/platformUtils";
import { appVersion } from "shared/data/releaseInfo";
import {
  getActiveCommVer,
  getActiveProxyType,
  getServerSoftwareVersion,
  getServerSystemVersion,
  targetCommVer,
  targetCommVerString,
} from "shared/connection/connectionManager";
import { communityPage, supportEmail } from "shared/data/linkConstants";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

/**
 * A dialog that presents help and feedback options
 */
export default function FeedbackDialog(props: {
  isOpen: boolean;
  onDismiss: () => void;
}) {
  const propsOnDismiss = props.onDismiss;

  const onClickEmail = useCallback(async () => {
    const body =
      `\n\n---------- DEVICE INFORMATION ----------` +
      Object.entries(await getPlatformUtils().getExtraEmailDetails())
        .map(([key, value]) => `\n${key}: ${value}`)
        .join("") +
      `\nUser agent: ${navigator.userAgent}` +
      `\nClient version: ${appVersion}` +
      `\nCommunications version: ${getActiveCommVer()?.join(
        "."
      )} (target ${targetCommVerString})` +
      `\nProxy type: ${getActiveProxyType()}` +
      `\nServer system version: ${getServerSystemVersion()}` +
      `\nServer software version: ${getServerSoftwareVersion()}`;
    const url = `mailto:${supportEmail}?subject=${encodeURIComponent(
      "AirMessage feedback"
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
    propsOnDismiss();
  }, [propsOnDismiss]);

  const onClickCommunity = useCallback(() => {
    window.open(communityPage, "_blank");
    propsOnDismiss();
  }, [propsOnDismiss]);

  return (
    <Dialog open={props.isOpen} onClose={props.onDismiss}>
      <DialogTitle>Help and feedback</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Have a bug to report, a feature to suggest, or anything else to say?
          Contact us or discuss with others using the links below.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClickEmail} color="primary">
          Send E-Mail
        </Button>
        <Button onClick={onClickCommunity} color="primary" autoFocus>
          Open community subreddit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
