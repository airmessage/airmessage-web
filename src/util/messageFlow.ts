import PaletteSpecifier from "shared/data/paletteSpecifier";

/**
 * A message's position in the thread in accordance with other nearby messages
 */
export interface MessageFlow {
  //Whether this message should be anchored to the message above
  anchorTop: boolean;

  //Whether this message should be anchored to the message below
  anchorBottom: boolean;

  //Whether this message should have a divider between it and the message below
  showDivider: boolean;
}

export interface MessagePartFlow {
  //Whether this message is outgoing
  isOutgoing: boolean;

  //Whether this message is unconfirmed, and should be rendered as such
  isUnconfirmed: boolean;

  color: PaletteSpecifier; //Text and action button colors
  backgroundColor: PaletteSpecifier; //Message background color

  //Whether this message should be anchored to the message above
  anchorTop: boolean;

  //Whether this message should be anchored to the message below
  anchorBottom: boolean;
}

const radiusLinked = "4px";
const radiusUnlinked = "16.5px";

/**
 * Generates a CSS border radius string from the provided flow
 */
export function getFlowBorderRadius(flow: MessagePartFlow): string {
  const radiusTop = flow.anchorTop ? radiusLinked : radiusUnlinked;
  const radiusBottom = flow.anchorBottom ? radiusLinked : radiusUnlinked;

  if (flow.isOutgoing) {
    return `${radiusUnlinked} ${radiusTop} ${radiusBottom} ${radiusUnlinked}`;
  } else {
    return `${radiusTop} ${radiusUnlinked} ${radiusUnlinked} ${radiusBottom}`;
  }
}

const opacityUnconfirmed = 0.5;

/**
 * Generates a CSS opacity radius value from the provided flow
 */
export function getFlowOpacity(flow: MessagePartFlow): number | undefined {
  if (flow.isUnconfirmed) {
    return opacityUnconfirmed;
  } else {
    return undefined;
  }
}

const spacingLinked = 0.25;
const spacingUnlinked = 1;

/**
 * Gets the spacing value to use between message bubbles
 * @param linked Whether the message is linked to the adjacent message
 */
export function getBubbleSpacing(linked: boolean): number {
  if (linked) {
    return spacingLinked;
  } else {
    return spacingUnlinked;
  }
}
