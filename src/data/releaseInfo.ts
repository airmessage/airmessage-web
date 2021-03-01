import {DateTime} from "luxon";

export const appVersion = import.meta.env.SNOWPACK_PUBLIC_VERSION;
export const releaseHash = import.meta.env.SNOWPACK_PUBLIC_RELEASE_HASH;
export const buildDate = import.meta.env.SNOWPACK_PUBLIC_BUILD_DATE ? parseInt(import.meta.env.SNOWPACK_PUBLIC_BUILD_DATE) : undefined;

export function getFormattedBuildDate(): string | undefined {
	if(!buildDate) return undefined;
	return DateTime.fromSeconds(buildDate).toLocaleString(DateTime.DATE_FULL);
}