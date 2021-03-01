const sizeUnits = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
const bytesPerUnit = 1024;

//https://stackoverflow.com/a/18650828
export function formatFileSize(bytes: number, decimals = 2): string {
	if(bytes === 0) return "0 bytes";
	
	const dm = Math.max(decimals, 0);
	
	const i = Math.floor(Math.log(bytes) / Math.log(bytesPerUnit));
	
	return parseFloat((bytes / Math.pow(bytesPerUnit, i)).toFixed(dm)) + " " + sizeUnits[i];
}

//https://stackoverflow.com/a/40031979
export function arrayBufferToHex(data: ArrayBuffer): string {
	return Array.prototype.map.call(new Uint8Array(data), (x: number) => ("00" + x.toString(16)).slice(-2)).join("");
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as ArrayBuffer);
		reader.onerror = reject;
		reader.readAsArrayBuffer(blob);
	});
}