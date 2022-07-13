import React from "react";
import {
  Box,
  LinearProgress,
  linearProgressClasses,
  Typography,
} from "@mui/material";

export default function DetailLoading() {
  return (
    <Box
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <Typography color="textSecondary">
        Getting your messages&#8230;
      </Typography>

      <LinearProgress
        sx={{
          width: 300,
          borderRadius: 8,
          [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 8,
          },
        }}
      />
    </Box>
  );
}
