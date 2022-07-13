import { Base64 } from "js-base64";

/**
 * Encodes the passed ArrayBuffer to a base64 string
 */
export function encodeBase64(value: ArrayBuffer): string {
  return Base64.fromUint8Array(new Uint8Array(value));
}

/**
 * Decodes a base64 string to an ArrayBuffer
 */
export function decodeBase64(value: string): ArrayBuffer {
  return Base64.toUint8Array(value);
}

/**
 * Encodes an ArrayBuffer to a hex string
 */
//https://stackoverflow.com/a/40031979
export function arrayBufferToHex(data: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(data), (x: number) =>
      ("00" + x.toString(16)).slice(-2)
    )
    .join("");
}
