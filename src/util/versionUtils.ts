/* Compares 2 version lists and returns which one is larger
-1: version 1 is smaller
 0: versions are equal
 1: version 1 is greater
 */
export function compareVersions(
  version1: number[],
  version2: number[]
): number {
  for (let i = 0; i < Math.max(version1.length, version2.length); i++) {
    //Get the version codes, defaulting to 0 if the length exceeds the code
    const code1 = version1[i] ?? 0;
    const code2 = version2[i] ?? 0;

    //Compare the codes
    const comparison = code1 - code2;

    if (comparison != 0) {
      return comparison;
    }
  }

  //All version codes are the same, no difference
  return 0;
}
