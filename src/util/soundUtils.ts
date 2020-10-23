export function playSoundNotification() {
	new Audio(process.env.PUBLIC_URL + "/audio/notification.wav").play()?.catch((reason) => {
		console.log("Failed to play notification audio: " + reason);
	});
}

export function playSoundMessageIn() {
	new Audio(process.env.PUBLIC_URL + "/audio/message_in.wav").play()?.catch((reason) => {
		console.log("Failed to play incoming message audio: " + reason);
	})
}

export function playSoundMessageOut() {
	new Audio(process.env.PUBLIC_URL + "/audio/message_out.wav").play()?.catch((reason) => {
		console.log("Failed to play outgoing message audio: " + reason);
	});
}

export function playSoundTapback() {
	new Audio(process.env.PUBLIC_URL + "/audio/tapback.wav").play()?.catch((reason) => {
		console.log("Failed to play tapback audio: " + reason);
	});
}