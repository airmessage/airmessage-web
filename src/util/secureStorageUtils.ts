import * as secrets from "../secrets";

const keyServerPassword = "serverPassword";
const ivLen = 12;

const cryptoKey: Promise<CryptoKey> = crypto.subtle.importKey(
	"jwk",
	secrets.jwkLocalEncryption,
	"AES-GCM",
	false,
	["encrypt", "decrypt"]
);

function concatBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer {
	const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(new Uint8Array(buffer1), 0);
	tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
	return tmp;
}

async function encrypt(inData: ArrayBuffer, generateIV: boolean): Promise<ArrayBuffer> {
	if(generateIV) {
		const iv = window.crypto.getRandomValues(new Uint8Array(ivLen));
		const encrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, await cryptoKey, inData);
		return concatBuffers(iv, encrypted);
	} else {
		return crypto.subtle.encrypt({name: "AES-GCM", iv: new Uint8Array(ivLen)}, await cryptoKey, inData);
	}
}

async function decrypt(inData: ArrayBuffer, useIV: boolean): Promise<ArrayBuffer> {
	if(useIV) {
		const iv = inData.slice(0, ivLen);
		const data = inData.slice(ivLen);
		return crypto.subtle.decrypt({name: "AES-GCM", iv: iv}, await cryptoKey, data);
	} else {
		return crypto.subtle.decrypt({name: "AES-GCM", iv: new Int8Array(ivLen)}, await cryptoKey, inData);
	}
}

function encodeBase64(value: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(value)));
}

function decodeBase64(value: string): ArrayBuffer {
	return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

/**
 * Encrypts a string and returns it in base64 form
 */
async function encryptString(value: string, generateIV: boolean): Promise<string> {
	return encodeBase64(await encrypt(new TextEncoder().encode(value), generateIV));
}

/**
 * Decrypts a string from its base64 form
 */
async function decryptString(value: string, useIV: boolean): Promise<string> {
	return new TextDecoder().decode(await decrypt(decodeBase64(value), useIV));
}

export async function setLS(key: string, value: string | undefined) {
	key = await encryptString(key, false);
	console.log("Saving under key " + key);
	
	if(value === undefined) {
		localStorage.removeItem(key);
	} else {
		value = await encryptString(value, true);
		localStorage.setItem(key, value);
	}
}

export async function getLS(key: string): Promise<string | undefined> {
	const value = localStorage.getItem(await encryptString(key, false));
	if(value === null) {
		return undefined;
	} else {
		return decryptString(value, true);
	}
}

export async function saveServerPassword(password: string | undefined) {
	return setLS(keyServerPassword, password);
}

export async function getServerPassword(): Promise<string | undefined> {
	return getLS(keyServerPassword);
}