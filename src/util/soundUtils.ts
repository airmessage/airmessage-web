import soundNotification from "shared/resources/audio/notification.wav";
import soundMessageIn from "shared/resources/audio/message_in.wav";
import soundMessageOut from "shared/resources/audio/message_out.wav";
import soundTapback from "shared/resources/audio/tapback.wav";

/**
 * Plays the audio sound for an incoming notification
 */
export function playSoundNotification() {
	playAudio(soundNotification);
}

/**
 * Plays the audio sound for an incoming message
 */
export function playSoundMessageIn() {
	playAudio(soundMessageIn);
}

/**
 * Plays the audio sound for an outgoing message
 */
export function playSoundMessageOut() {
	playAudio(soundMessageOut);
}

/**
 * Plays the audio sound for a new tapback
 */
export function playSoundTapback() {
	playAudio(soundTapback);
}

/**
 * Plays an audio file
 * @param src The audio file URI to load and play
 */
function playAudio(src: string) {
	//Initialize the audio
	const audio = new Audio(src);
	
	//Play the audio
	let playResult: Promise<void> | undefined;
	try {
		playResult = audio.play();
	} catch(error) {
		console.log(`Failed to play audio: ${src}: ${error}`);
	}
	
	//Handle any asynchronous errors
	playResult?.catch((error) => {
		console.log(`Failed to play audio: ${src}: ${error}`);
	});
}
