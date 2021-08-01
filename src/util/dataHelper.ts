export function encodeBase64(value: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(value)));
}

export function decodeBase64(value: string): ArrayBuffer {
	return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
