const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
// const ESLintPlugin = require("eslint-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

module.exports = (env) => ({
	entry: "./src/index.tsx",
	target: env.electron ? "electron-renderer" : "web",
	mode: env.WEBPACK_SERVE ? "development" : "production",
	devtool: env.WEBPACK_SERVE ? "cheap-source-map" : "source-map",
	devServer: {
		contentBase: path.join(__dirname, "public"),
		port: 8080,
		https: env.secure ? {
			key: fs.readFileSync("webpack.key"),
			cert: fs.readFileSync("webpack.crt"),
		} : undefined
	},
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "index.js",
		assetModuleFilename: "res/[hash][ext][query]",
		publicPath: "",
		clean: true
	},
	module: {
		rules: [
			{
				test: /\.ts(x)?$/,
				loader: "ts-loader",
				exclude: /node_modules/,
				options: {
					transpileOnly: true,
					happyPackMode: true
				}
			},
			{
				test: /\.css$/,
				use: [
					"style-loader",
					"css-loader"
				],
				exclude: /\.module\.css$/
			},
			{
				test: /\.css$/,
				use: [
					"style-loader",
					{
						loader: "css-loader",
						options: {
							importLoaders: 1,
							modules: true
						}
					}
				],
				include: /\.module\.css$/
			},
			{
				test: /\.node$/,
				loader: "node-loader"
			},
			{
				test: /\.(svg)|(wav)$/,
				type: "asset/resource"
			},
			{
				test: /\.md$/,
				type: "asset/source"
			}
		]
	},
	resolve: {
		extensions: [
			".tsx",
			".ts",
			".js"
		],
		alias: {
			"shared": path.resolve(__dirname, "src"),
			"platform-components": path.resolve(__dirname, env.electron ? "electron-renderer" : "browser")
		}
	},
	optimization: {
		usedExports: true
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin({
			eslint: {
				files: "./{src,browser,electron-main,electron-renderer}/**/*.{ts,tsx,js,jsx}"
			}
		}),
		/* new ESLintPlugin({
			files: ["src", "browser", "electron-main", "electron-renderer"],
			extensions: ["js", "jsx", "ts", "tsx"]
		}), */
		new CopyPlugin({
			patterns: [
				{from: "public"}
			].concat(env.electron ? [{from: "electron-main"}] : []),
		}),
		new webpack.DefinePlugin({
			"WPEnv.ENVIRONMENT": JSON.stringify(env.WEBPACK_SERVE ? "development" : "production"),
			"WPEnv.IS_ELECTRON": env.electron,
			"WPEnv.PACKAGE_VERSION": JSON.stringify(process.env.npm_package_version),
			"WPEnv.RELEASE_HASH": "\"undefined\"",
			"WPEnv.BUILD_DATE": Date.now()
		}),
	].concat(!env.WEBPACK_SERVE && !env.electron ? new WorkboxPlugin.GenerateSW() : [])
});