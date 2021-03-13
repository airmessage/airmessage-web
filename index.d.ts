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
	[key: string]: any;
};