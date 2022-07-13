import React from "react";
import { Skeleton, Stack } from "@mui/material";

/**
 * A placeholder conversation entry
 */
export default function ConversationSkeleton() {
  return (
    <Stack direction="row" padding={2}>
      <Skeleton variant="circular" width={40} height={40} animation={false} />
      <Stack direction="column" marginLeft={2} flexGrow={1}>
        <Skeleton variant="text" animation={false} />
        <Skeleton variant="text" animation={false} />
      </Stack>
    </Stack>
  );
}
