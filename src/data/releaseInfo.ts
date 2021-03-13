import {DateTime} from "luxon";

export const appVersion: string = WPEnv.PACKAGE_VERSION;
export const releaseHash: string = WPEnv.RELEASE_HASH;
export const buildDate: number = WPEnv.BUILD_DATE ? WPEnv.BUILD_DATE : undefined;

export function getFormattedBuildDate(): string | undefined {
	if(!buildDate) return undefined;
	return DateTime.fromMillis(buildDate).toLocaleString(DateTime.DATE_FULL);
}