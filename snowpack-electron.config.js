/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
	extends: "./snowpack.config.js",
	exclude: [
		"browser"
	],
	mount: {
		"electron-main": "/",
		"electron-renderer": "/electron-renderer",
	},
	alias: {
		"platform-components": "./electron-renderer"
	},
};