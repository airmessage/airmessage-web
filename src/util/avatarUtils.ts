import { hashString } from "shared/util/hashUtils";

const colors = [
  "#FF1744", //Red
  "#F50057", //Pink
  "#B317CF", //Purple
  "#703BE3", //Dark purple
  "#3D5AFE", //Indigo
  "#2979FF", //Blue
  "#00B0FF", //Light blue
  "#00B8D4", //Cyan
  "#00BFA5", //Teal
  "#00C853", //Green
  "#5DD016", //Light green
  "#99CC00", //Lime green
  "#F2CC0D", //Yellow
  "#FFC400", //Amber
  "#FF9100", //Orange
  "#FF3D00", //Deep orange
];

/**
 * Gets a pseudorandom color to use for a certain contact address
 */
export function colorFromContact(contact: string): string {
  return colors[Math.abs(hashString(contact)) % colors.length];
}
