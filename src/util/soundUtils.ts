export function playSoundNotification() {
	new Audio(process.env.PUBLIC_URL + "/audio/notification.wav").play();
}

export function playSoundMessageIn() {
	new Audio(process.env.PUBLIC_URL + "/audio/message_in.wav").play();
}

export function playSoundMessageOut() {
	new Audio(process.env.PUBLIC_URL + "/audio/message_out.wav").play();
}