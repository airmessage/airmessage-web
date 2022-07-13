import React from "react";
import { TapbackType } from "shared/data/stateCodes";
import TapbackLoveIcon from "shared/components/icon/TapbackLoveIcon";
import TapbackLikeIcon from "shared/components/icon/TapbackLikeIcon";
import TapbackDislikeIcon from "shared/components/icon/TapbackDislikeIcon";
import TapbackLaughIcon from "shared/components/icon/TapbackLaughIcon";
import TapbackEmphasisIcon from "shared/components/icon/TapbackEmphasisIcon";
import TapbackQuestionIcon from "shared/components/icon/TapbackQuestionIcon";
import { Stack, Typography } from "@mui/material";
import { Theme } from "@mui/material/styles";

/**
 * A single tapback chip
 * @param props.type The type of tapback
 * @param props.count The amount of reactions of this tapback type
 */
export default function TapbackChip(props: {
  type: TapbackType;
  count: number;
  isMine: boolean;
}) {
  let Icon: React.ElementType;
  switch (props.type) {
    case TapbackType.Love:
      Icon = TapbackLoveIcon;
      break;
    case TapbackType.Like:
      Icon = TapbackLikeIcon;
      break;
    case TapbackType.Dislike:
      Icon = TapbackDislikeIcon;
      break;
    case TapbackType.Laugh:
      Icon = TapbackLaughIcon;
      break;
    case TapbackType.Emphasis:
      Icon = TapbackEmphasisIcon;
      break;
    case TapbackType.Question:
      Icon = TapbackQuestionIcon;
      break;
  }

  return (
    <Stack
      sx={{
        paddingX: "6px",
        minWidth: 8,
        height: 18,
        borderStyle: "solid",
        borderRadius: 4,
        borderWidth: 2,
        backgroundColor: `${
          props.isMine ? "messageOutgoing" : "messageIncoming"
        }.main`,
        borderColor: "background.default",
      }}
      direction="row"
      alignItems="center"
      justifyContent="center"
    >
      <Icon
        sx={{
          color: (theme: Theme) =>
            `${props.isMine ? "messageOutgoing" : "messageIncoming"}.main`,
          width: 12,
          height: 12,
        }}
      />

      {props.count > 1 && (
        <Typography variant="body2" color="secondary">
          {props.count}
        </Typography>
      )}
    </Stack>
  );
}
