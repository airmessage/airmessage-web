import { Base64 } from "js-base64";

export function encodeBase64(value: ArrayBuffer): string {
	return Base64.fromUint8Array(new Uint8Array(value));
}

export function decodeBase64(value: string): ArrayBuffer {
	return Base64.toUint8Array(value);
}
