//Creating the constants
const saltLen = 8; //8 bytes
const ivLen = 12; //12 bytes (instead of 16 because of GCM)
const algorithm = "PBKDF2";
const hash = "SHA-256";
const cipherTransformation = "AES-GCM";
const keyIterationCount = 10000;
const keyLength = 128; //128 bits

let userKey: CryptoKey;

export async function setPassword(password: string) {
	userKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
}

export async function encryptData(inData: ArrayBuffer): Promise<ArrayBuffer> {
	//Generating random data
	const salt = new Uint8Array(saltLen);
	crypto.getRandomValues(salt);
	const iv = new Uint8Array(ivLen);
	crypto.getRandomValues(iv);
	
	//Creating the key
	const derivedKey = await crypto.subtle.deriveKey({name: algorithm, salt: salt, iterations: keyIterationCount, hash: hash},
		userKey,
		{name: cipherTransformation, length: keyLength},
		false,
		["encrypt"]);
	
	//Encrypting the data
	const encrypted = await crypto.subtle.encrypt({name: cipherTransformation, iv: iv}, derivedKey, inData);
	
	//Returning the data
	const returnData = new Uint8Array(saltLen + ivLen + encrypted.byteLength);
	returnData.set(salt, 0);
	returnData.set(iv, saltLen);
	returnData.set(new Uint8Array(encrypted), saltLen + ivLen);
	return returnData.buffer;
}

export async function decryptData(inData: ArrayBuffer): Promise<ArrayBuffer> {
	//Reading the data
	const salt = inData.slice(0, saltLen);
	const iv = inData.slice(saltLen, saltLen + ivLen);
	const data = inData.slice(saltLen + ivLen);
	
	//Creating the key
	const derivedKey = await crypto.subtle.deriveKey({name: algorithm, salt: salt, iterations: keyIterationCount, hash: hash},
		userKey,
		{name: cipherTransformation, length: keyLength},
		false,
		["decrypt"]);
	
	//Decrypting the data
	return await crypto.subtle.decrypt({name: cipherTransformation, iv: iv}, derivedKey, data);
}