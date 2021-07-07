import React from "react";
import ReactMarkdown, {MarkdownToJSX} from "markdown-to-jsx";
import {Theme, withStyles} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import {makeStyles} from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) => ({
	listItem: {
		marginTop: theme.spacing(1),
	}
}));

const options: MarkdownToJSX.Options = {
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
			component: React.memo(({...props}) => (
				<li className={useStyles().listItem}>
					<Typography component="span" {...props} />
				</li>
			)),
		},
	},
};

export default function Markdown(props: {markdown: string}) {
	return <ReactMarkdown options={options}>{props.markdown}</ReactMarkdown>;
}