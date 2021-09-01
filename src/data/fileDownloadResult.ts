/**
 * Represents downloaded file data
 */
export default interface FileDownloadResult {
	data: ArrayBuffer, //The data of the downloaded file
	downloadName?: string, //The updated name of the downloaded file
	downloadType?: string //The updated MIME type of the downloaded file
}

/**
 * Represents merged attachment file data
 */
export interface FileDisplayResult {
	data?: ArrayBuffer | Blob, //The data of the downloaded file
	name: string, //The display name of the downloaded file
	type: string //The display MIME type of the downloaded file
}