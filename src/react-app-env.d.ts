/// <reference types="react-scripts" />

declare module "*.module.css" {
	const classes: { [key: string]: string };
	export default classes;
}

/**
 * The type of `import.meta`.
 *
 * If you need to declare that a given property exists on `import.meta`,
 * this type may be augmented via interface merging.
 */
interface ImportMeta {
	hot: {
		accept: VoidFunction;
	};
	env: {
		NODE_ENV: "development" | "production";
		[key: string]: string;
	};
}