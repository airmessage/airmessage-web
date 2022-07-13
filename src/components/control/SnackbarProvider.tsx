import React from "react";
import { Snackbar } from "@mui/material";
import { SnackbarCloseReason } from "@mui/material/Snackbar/Snackbar";

interface SnackbarData {
  message: string;
  action?: React.ReactNode;
}

interface SnackbarFunction {
  (data: SnackbarData): void;
}

export const SnackbarContext = React.createContext<SnackbarFunction>(() =>
  console.error("No snackbar function provided")
);

export default function SnackbarProvider(props: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [data, setData] = React.useState<SnackbarData>();

  function displaySnackbar(data: SnackbarData) {
    setOpen(true);
    setData(data);
  }

  function handleClose(
    event: React.SyntheticEvent<any> | Event,
    reason: SnackbarCloseReason
  ) {
    if (reason === "clickaway") return;
    setOpen(false);
  }

  return (
    <SnackbarContext.Provider value={displaySnackbar}>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={data?.message}
        action={data?.action}
      />
      {props.children}
    </SnackbarContext.Provider>
  );
}
