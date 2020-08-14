import {DateTime} from "luxon";

export const appVersion = "0.1";
export const appVersionRelease = new Date(2020, 7, 14);

export function getAppVersionReleaseString() {
	return DateTime.fromJSDate(appVersionRelease).toLocaleString(DateTime.DATE_FULL);
}