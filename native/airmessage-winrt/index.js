const path = require("path");

try {
	module.exports = require("./build/Release/airmessage-winrt.node"); //Production build
} catch {
	global.process.dlopen(module, path.resolve(path.resolve(__dirname).split("\\node_modules")[0], "native/airmessage-winrt/build/Release/airmessage-winrt.node")); //Development server
}