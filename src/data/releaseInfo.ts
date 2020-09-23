import {DateTime} from "luxon";

export const appVersion = process.env.REACT_APP_VERSION;
export const releaseHash = process.env.REACT_APP_RELEASE_HASH;
export const buildDate = process.env.REACT_APP_BUILD_DATE ? parseInt(process.env.REACT_APP_BUILD_DATE) : undefined;

export function getFormattedBuildDate(): string | undefined {
	if(!buildDate) return undefined;
	return DateTime.fromSeconds(buildDate).toLocaleString(DateTime.DATE_FULL);
}