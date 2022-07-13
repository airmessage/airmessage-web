import React from "react";
import { SvgIcon, SvgIconProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function BorderedCloseIcon(props: SvgIconProps) {
  const theme = useTheme();

  const colorBackground =
    theme.palette.mode === "light"
      ? theme.palette.grey["700"]
      : theme.palette.grey["300"];
  const colorSymbol =
    theme.palette.mode === "light"
      ? theme.palette.grey["200"]
      : theme.palette.grey["700"];

  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" fill={colorBackground} />
      <path
        d="M12,2 C6.47,2 2,6.47 2,12 C2,17.53 6.47,22 12,22 C17.53,22 22,17.53 22,12 C22,6.47 17.53,2 12,2 Z M12,20 C7.59,20 4,16.41 4,12 C4,7.59 7.59,4 12,4 C16.41,4 20,7.59 20,12 C20,16.41 16.41,20 12,20 Z"
        fill={theme.palette.messageIncoming.main}
      />
      <path
        d="M13.89,8.7 L12,10.59 L10.11,8.7 C9.72,8.31 9.09,8.31 8.7,8.7 C8.31,9.09 8.31,9.72 8.7,10.11 L10.59,12 L8.7,13.89 C8.31,14.28 8.31,14.91 8.7,15.3 C9.09,15.69 9.72,15.69 10.11,15.3 L12,13.41 L13.89,15.3 C14.28,15.69 14.91,15.69 15.3,15.3 C15.69,14.91 15.69,14.28 15.3,13.89 L13.41,12 L15.3,10.11 C15.69,9.72 15.69,9.09 15.3,8.7 C14.91,8.32 14.27,8.32 13.89,8.7 Z"
        fill={colorSymbol}
      />
    </SvgIcon>
  );
}
