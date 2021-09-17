import React from "react";

import {SvgIcon, SvgIconProps} from "@mui/material";

export default function EthernetIcon(props: SvgIconProps) {
	return (
		<SvgIcon {...props}>
			<path d="M11,3V7H13V3H11M8,4V11H16V4H14V8H10V4H8M10,12V22H14V12H10Z" />
		</SvgIcon>
	);
}