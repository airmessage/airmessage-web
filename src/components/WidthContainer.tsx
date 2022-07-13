import { Box, styled } from "@mui/material";

const WidthContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 1000,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  margin: "auto",

  flexGrow: 1,
  flexShrink: 1,
  minHeight: 0,
}));
export default WidthContainer;
