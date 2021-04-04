import {DateTime} from "luxon";

export const appVersion = WPEnv.PACKAGE_VERSION;
export const releaseHash = WPEnv.RELEASE_HASH;
export const buildDate = WPEnv.BUILD_DATE;

export function getFormattedBuildDate(): string | undefined {
	if(!buildDate) return undefined;
	return DateTime.fromMillis(buildDate).toLocaleString(DateTime.DATE_FULL);
}