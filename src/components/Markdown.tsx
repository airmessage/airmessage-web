import React from "react";
import ReactMarkdown from "markdown-to-jsx";
import {Theme, withStyles} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";

const styles = (theme: Theme) => ({
	listItem: {
		marginTop: theme.spacing(1),
	}
});

const options = {
	overrides: {
		h1: {
			component: Typography,
			props: {
				gutterBottom: true,
				variant: "h5",
			},
		},
		h2: { component: Typography, props: { gutterBottom: true, variant: "h6" } },
		h3: { component: Typography, props: { gutterBottom: true, variant: "subtitle1" } },
		h4: {
			component: Typography,
			props: { gutterBottom: true, variant: "caption", paragraph: true },
		},
		span: { component: Typography },
		p: { component: Typography, props: { paragraph: true } },
		a: { component: Link },
		li: {
			component: withStyles(styles)(({...props}) => (
				<li className={(props as any).classes.listItem}>
					<Typography component="span" {...props} />
				</li>
			)),
		},
	},
};

export default function Markdown(props: {markdown: string}) {
	return <ReactMarkdown options={options}>{props.markdown}</ReactMarkdown>;
}