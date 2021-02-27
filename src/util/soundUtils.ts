export function playSoundNotification() {
	new Audio(import.meta.env.SNOWPACK_PUBLIC_URL_PREFIX + "audio/notification.wav").play()?.catch((reason) => {
		console.log("Failed to play notification audio: " + reason);
	});
}

export function playSoundMessageIn() {
	new Audio(import.meta.env.SNOWPACK_PUBLIC_URL_PREFIX + "audio/message_in.wav").play()?.catch((reason) => {
		console.log("Failed to play incoming message audio: " + reason);
	});
}

export function playSoundMessageOut() {
	new Audio(import.meta.env.SNOWPACK_PUBLIC_URL_PREFIX + "audio/message_out.wav").play()?.catch((reason) => {
		console.log("Failed to play outgoing message audio: " + reason);
	});
}

export function playSoundTapback() {
	new Audio(import.meta.env.SNOWPACK_PUBLIC_URL_PREFIX + "audio/tapback.wav").play()?.catch((reason) => {
		console.log("Failed to play tapback audio: " + reason);
	});
}