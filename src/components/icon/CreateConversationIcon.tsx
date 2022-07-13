import React from "react";

import { SvgIcon, SvgIconProps } from "@mui/material";

export default function CreateConversationIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <g transform="translate(3.000000, 2.000000)">
        <path
          d="M2,2 C0.89,2 0,2.89 0,4 L0,17 C0,18.1045695 0.8954305,19 2,19 L15,19 C16.1045695,19 17,18.1045695 17,17 C17,12.3333333 17,9.66666667 17,9 C17,8.33333333 16.6666667,8 16,8 C15.3333333,8 15,8.33333333 15,9 C15,9.66666667 15,12.3333333 15,17 L2,17 L2,4 C6.66666667,4 9.33333333,4 10,4 C10.6666667,4 11,3.66666667 11,3 L11,3 C11,2.33333333 10.6666667,2 10,2 M16.78,0 C16.61,0 16.43,0.07 16.3,0.2 L15.08,1.41 L17.58,3.91 L18.8,2.7 C19.06,2.44 19.06,2 18.8,1.75 L17.25,0.2 C17.12,0.07 16.95,0 16.78,0 M14.37,2.12 L6,10.5 L6,13 L8.5,13 L16.87,4.62 L14.37,2.12 Z"
          id="Shape"
        />
      </g>
    </SvgIcon>
  );
}
