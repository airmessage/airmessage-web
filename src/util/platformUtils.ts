import EventEmitter from "shared/util/eventEmitter";

export abstract class PlatformUtils {
	/**
	 * Checks for pending activations and sets up a listener for new activations.
	 * This method should be called when the app is prepared to handle activations.
	 */
	abstract initializeActivations(): void;
	
	/**
	 * Gets the event emitter for when a chat is activated
	 */
	abstract getChatActivationEmitter(): EventEmitter<string> | undefined;
	
	/**
	 * Checks if the app currently has focus.
	 */
	abstract hasFocus(): Promise<boolean>;
}

let platformUtils: PlatformUtils;
export function setPlatformUtils(value: PlatformUtils) {
	platformUtils = value;
}
export function getPlatformUtils() {
	return platformUtils;
}