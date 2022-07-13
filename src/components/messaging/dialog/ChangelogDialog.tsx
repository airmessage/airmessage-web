import {
  appVersion,
  getFormattedBuildDate,
  releaseHash,
} from "shared/data/releaseInfo";
import { Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import Markdown from "shared/components/Markdown";
import changelog from "shared/resources/text/changelog.md";
import React from "react";

/**
 * A dialog that shows the app version and latest changelog
 */
export default function ChangelogDialog(props: {
  isOpen: boolean;
  onDismiss: () => void;
}) {
  //Generating the build details
  const buildDate = getFormattedBuildDate();
  const buildVersion = `AirMessage for web ${appVersion}`;
  const detailedBuildVersion = buildVersion + ` (${releaseHash ?? "unlinked"})`;
  const buildTitle =
    buildVersion +
    (buildDate
      ? `, ${
          WPEnv.ENVIRONMENT === "production" ? "released" : "built"
        } ${buildDate}`
      : "");

  return (
    <Dialog open={props.isOpen} onClose={props.onDismiss} fullWidth>
      <DialogTitle>Release notes</DialogTitle>
      <DialogContent dividers>
        <Typography
          variant="overline"
          color="textSecondary"
          gutterBottom
          title={detailedBuildVersion}
        >
          {buildTitle}
        </Typography>
        <Markdown markdown={changelog} />
      </DialogContent>
    </Dialog>
  );
}
