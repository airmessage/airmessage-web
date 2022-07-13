import React from "react";
import styles from "./AirMessageLogo.module.css";
import { useTheme } from "@mui/material/styles";

export default function AirMessageLogo() {
  const textColor = useTheme().palette.text.primary;

  return (
    <div className={styles.logo}>
      <Logo color={textColor} />
      <span style={{ color: textColor, opacity: 0.75 }}>AirMessage</span>
    </div>
  );
}

function Logo(props: { color: string }) {
  return (
    <svg
      version="1.1"
      viewBox="0 0 26 26"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      style={{ opacity: 0.75 }}
    >
      <g fill="none" fillRule="evenodd">
        <g id="icon-stroke" stroke={props.color}>
          <g transform="translate(1 1)">
            <circle cx="12" cy="12" r="11.864" strokeWidth="2.2857" />
            <g
              transform="translate(7 5.3636)"
              strokeLinecap="square"
              strokeWidth="2.29"
            >
              <line x1="5" x2="10" y2="5" />
              <line x1="5" y2="5" />
              <line x1="5.2455" x2="5.2455" y1="1" y2="14" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
