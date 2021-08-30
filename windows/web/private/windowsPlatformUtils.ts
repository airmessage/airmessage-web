import {PlatformUtils} from "shared/util/platformUtils";
import {
	activateChatEventEmitter,
	windowsGetSystemVersion,
	windowsHasFocus,
	windowsRegisterActivations
} from "./interopUtils";

export default class WindowsPlatformUtils extends PlatformUtils {
	initializeActivations() {
		windowsRegisterActivations();
	}
	
	hasFocus() {
		return windowsHasFocus();
	}
	
	getChatActivationEmitter() {
		return activateChatEventEmitter;
	}
	
	async getExtraEmailDetails() {
		return {
			"Windows version": await windowsGetSystemVersion()
		};
	}
}