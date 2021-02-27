/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
	mount: {
		// directory name: 'build directory'
		public: "/",
		src: "/dist",
		browser: "/browser"
	},
	alias: {
		"shared": "./src",
		"platform-components": "./browser"
	},
	plugins: [
		"@snowpack/plugin-react-refresh",
		["@snowpack/plugin-webpack", {
			"sourceMap": true
		}]
		/* ["@snowpack/plugin-run-script", {
			"cmd": "eslint src browser electron-main electron-renderer --ext .js,jsx,.ts,.tsx",
			// Optional: Use npm package "eslint-watch" to run on every file change
			//"watch": "esw -w --clear src browser electron-main electron-renderer --ext .js,jsx,.ts,.tsx"
		}] */
	],
	routes: [
		/* Enable an SPA Fallback in development: */
		// {"match": "routes", "src": ".*", "dest": "/index.html"},
	],
	optimize: {
		/* Example: Bundle your final build: */
		// "bundle": true,
	},
	packageOptions: {
		/* ... */
	},
	devOptions: {
		/* ... */
	},
	buildOptions: {
		/* ... */
	},
};