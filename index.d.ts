declare module "*.module.css" {
	const classes: { [key: string]: string };
	export default classes;
}

declare module "*.svg" {
	const content: any;
	export default content;
}

declare module "*.wav" {
	const content: any;
	export default content;
}

declare module "*.md" {
	const content: string;
	export default content;
}

declare const WPEnv: {
	ENVIRONMENT: "production" | "development";
	IS_WEB: boolean;
	PACKAGE_VERSION: string;
	RELEASE_HASH: string | undefined;
	BUILD_DATE: number;
	WINRT: boolean;
};