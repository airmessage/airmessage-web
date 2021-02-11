/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
	extends: "./snowpack.config.js",
	mount: {
		"electron-main": "/",
		"electron-renderer": "/electron-renderer"
	}
};