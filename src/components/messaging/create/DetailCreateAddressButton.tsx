import { AddressData } from "shared/interface/people/peopleUtils";
import React, { useCallback } from "react";
import { Button, ButtonProps, styled } from "@mui/material";
import MessageCheckIcon from "shared/components/icon/MessageCheckIcon";
import { ChatBubbleOutline } from "@mui/icons-material";

const ToggleButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "amEnabled",
})<{ amEnabled: boolean } & ButtonProps>(({ amEnabled, theme }) => ({
  color: amEnabled ? theme.palette.primary.main : theme.palette.text.primary,
  textAlign: "start",
  textTransform: "none",
  opacity: amEnabled ? 1 : 0.7,
}));

/**
 * A checkbox button that represents a selectable address
 */
export default function DetailCreateAddressButton(props: {
  address: AddressData;
  selected: boolean;
  onClick: () => void;
}) {
  //Build the display value from the address and its label
  let display = props.address.displayValue;
  if (props.address.label !== undefined) display += ` (${props.address.label})`;

  const onMouseDown = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  return (
    <ToggleButton
      amEnabled={props.selected}
      startIcon={props.selected ? <MessageCheckIcon /> : <ChatBubbleOutline />}
      size="small"
      onClick={props.onClick}
      onMouseDown={onMouseDown}
    >
      {display}
    </ToggleButton>
  );
}
