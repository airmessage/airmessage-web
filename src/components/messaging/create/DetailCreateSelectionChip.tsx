import NewMessageUser from "shared/data/newMessageUser";
import React, { useMemo } from "react";
import { Avatar, Chip, Theme, Tooltip } from "@mui/material";
import { SxProps } from "@mui/system";

/**
 * A user selection chip that can be removed
 */
export default function DetailCreateSelectionChip(props: {
  sx?: SxProps<Theme>;
  selection: NewMessageUser;
  allSelections: NewMessageUser[];
  onRemove?: () => void;
}) {
  const { selection, allSelections, onRemove } = props;

  const [label, tooltip] = useMemo((): [string, string | undefined] => {
    //If the user has no name, use their display address
    if (selection.name === undefined) {
      return [
        selection.displayAddress,
        selection.addressLabel !== undefined
          ? `${selection.displayAddress} (${selection.addressLabel})`
          : undefined,
      ];
    }

    //If there is no address label, display the name
    if (selection.addressLabel === undefined) {
      return [selection.name, selection.displayAddress];
    }

    //If there are multiple entries with the same name, append
    //the address label as a discriminator
    if (
      allSelections.some(
        (allSelectionsEntry) =>
          selection !== allSelectionsEntry &&
          selection.name === allSelectionsEntry.name
      )
    ) {
      return [
        `${selection.name} (${selection.addressLabel})`,
        selection.displayAddress,
      ];
    }

    //Just display the name
    return [
      selection.name,
      `${selection.displayAddress} (${selection.addressLabel})`,
    ];
  }, [selection, allSelections]);

  const chip = (
    <Chip
      sx={props.sx}
      label={label}
      avatar={
        <Avatar src={props.selection.avatar} alt={props.selection.name} />
      }
      onDelete={onRemove}
    />
  );

  if (tooltip !== undefined) {
    return <Tooltip title={tooltip}>{chip}</Tooltip>;
  } else {
    return chip;
  }
}
