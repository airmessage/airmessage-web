import React from "react";
import ReactMarkdown, { MarkdownToJSX } from "markdown-to-jsx";
import { Link, makeStyles, styled, Typography } from "@mui/material";

const SpacedListItem = styled("li")(({ theme }) => ({
  marginTop: theme.spacing(1),
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
    h3: {
      component: Typography,
      props: { gutterBottom: true, variant: "subtitle1" },
    },
    h4: {
      component: Typography,
      props: { gutterBottom: true, variant: "caption", paragraph: true },
    },
    span: { component: Typography },
    p: { component: Typography, props: { paragraph: true } },
    a: { component: Link, props: { target: "_blank", rel: "noopener" } },
    li: { component: SpacedListItem },
  },
};

export default function Markdown(props: { markdown: string }) {
  return <ReactMarkdown options={options}>{props.markdown}</ReactMarkdown>;
}
