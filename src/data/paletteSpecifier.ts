import { Palette, PaletteColor } from "@mui/material";

/**
 * A color resolveable by MUI's palette
 */
type PaletteSpecifier = `${keyof Palette}.${keyof PaletteColor}`;
export default PaletteSpecifier;

export function accessPaletteColor(
  palette: Palette,
  specifier: PaletteSpecifier
): string {
  const specifierSplit = specifier.split(".", 2) as [
    keyof Palette,
    keyof PaletteColor
  ];
  const color = palette[specifierSplit[0]] as PaletteColor;
  return color[specifierSplit[1]] as string;
}
