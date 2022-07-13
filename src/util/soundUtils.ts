import soundNotification from "shared/resources/audio/notification.wav";
import soundMessageIn from "shared/resources/audio/message_in.wav";
import soundMessageOut from "shared/resources/audio/message_out.wav";
import soundTapback from "shared/resources/audio/tapback.wav";

/**
 * Plays the audio sound for an incoming notification
 */
export function playSoundNotification() {
  new Audio(soundNotification).play()?.catch((reason) => {
    console.log("Failed to play notification audio: " + reason);
  });
}

/**
 * Plays the audio sound for an incoming message
 */
export function playSoundMessageIn() {
  new Audio(soundMessageIn).play()?.catch((reason) => {
    console.log("Failed to play incoming message audio: " + reason);
  });
}

/**
 * Plays the audio sound for an outgoing message
 */
export function playSoundMessageOut() {
  new Audio(soundMessageOut).play()?.catch((reason) => {
    console.log("Failed to play outgoing message audio: " + reason);
  });
}

/**
 * Plays the audio sound for a new tapback
 */
export function playSoundTapback() {
  new Audio(soundTapback).play()?.catch((reason) => {
    console.log("Failed to play tapback audio: " + reason);
  });
}
