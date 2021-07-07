import React from "react";

import {ThemeProvider} from "@material-ui/core/styles";
import {createTheme, CssBaseline, useMediaQuery} from "@material-ui/core";

export default function AppTheme(props: {children: React.ReactNode}) {
	const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
	
	const theme = React.useMemo(() => createTheme({
		typography: {
			fontFamily: [
				"-apple-system",
				"BlinkMacSystemFont",
				'"Segoe UI"',
				"Roboto",
				'"Helvetica Neue"',
				"Arial",
				"sans-serif",
				'"Apple Color Emoji"',
				'"Segoe UI Emoji"',
				'"Segoe UI Symbol"',
			].join(","),
		},
		palette: {
			type: prefersDarkMode ? "dark" : "light",
			primary: {
				main: "#448AFF",
				dark: "#366FCC",
				light: "#52A7FF",
			},
			messageIncoming: prefersDarkMode ? {
				main: "#393939",
				contrastText: "#FFF"
			} : {
				main: "#EDEDED",
				contrastText: "rgba(0, 0, 0, 0.87)"
			},
			messageOutgoing: {
				main: "#448AFF",
				contrastText: "#FFF",
			},
			messageOutgoingTextMessage: {
				main: "#2ECC71",
				contrastText: "#FFF",
			},
			divider: prefersDarkMode ? "rgba(255, 255, 255, 0.1)" : "#EEEEEE",
			background: {
				default: prefersDarkMode ? "#1E1E1E" : "#FFFFFF",
				sidebar: prefersDarkMode ? "#272727" : "#FAFAFA"
			}
		},
		overrides: {
			MuiCssBaseline: {
				"@global": {
					html: {
						scrollbarColor: prefersDarkMode ? "#303030 #424242" : undefined
					}
				}
			}
		}
	}), [prefersDarkMode]);
	
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			
			{props.children}
		</ThemeProvider>
	);
}

declare module "@material-ui/core/styles/createPalette" {
	interface Palette {
		messageIncoming: Palette["primary"];
		messageOutgoing: Palette["primary"];
		messageOutgoingTextMessage: Palette["primary"];
	}
	
	interface PaletteOptions {
		messageIncoming: PaletteOptions["primary"];
		messageOutgoing: PaletteOptions["primary"];
		messageOutgoingTextMessage: PaletteOptions["primary"];
	}
	
	interface TypeBackground {
		sidebar: string;
	}
}