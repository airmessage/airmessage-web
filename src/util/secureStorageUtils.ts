import * as secrets from "../secrets";
import {decodeBase64, encodeBase64} from "shared/util/dataHelper";

const keyServerPassword = "serverPassword";
const ivLen = 12;

export enum SecureStorageKey {
	ServerPassword = "serverPassword",
	ServerAddress = "serverAddress",
	ServerAddressFallback = "serverAddressFallback"
}

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

export async function setSecureLS(key: SecureStorageKey, value: string | undefined) {
	const encryptedKey = await encryptString(key, false);
	
	if(value === undefined) {
		localStorage.removeItem(encryptedKey);
	} else {
		value = await encryptString(value, true);
		localStorage.setItem(encryptedKey, value);
	}
}

export async function getSecureLS(key: SecureStorageKey): Promise<string | undefined> {
	const value = localStorage.getItem(await encryptString(key, false));
	if(value === null) {
		return undefined;
	} else {
		return decryptString(value, true);
	}
}
