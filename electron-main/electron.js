const { app, BrowserWindow } = require("electron");
const path = require("path");
const contextMenu = require("electron-context-menu");

app.commandLine.appendSwitch("ignore-certificate-errors", "true");
app.commandLine.appendSwitch("allow-insecure-localhost", "true");

function createWindow() {
	contextMenu();
	
	const win = new BrowserWindow({
		width: 1000,
		height: 600,
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			preload: path.resolve(__dirname, "preload.js")
		},
		autoHideMenuBar: true
	});

	const startURL = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, "../build/index.html")}`;
	win.loadURL(startURL);

	/* if(process.env.ELECTRON_START_URL) {
		win.loadURL(process.env.ELECTRON_START_URL);
	} else {
		win.loadFile(path.join(__dirname, "index.html"));
	} */
}

app.whenReady().then(createWindow);

app.on("activate", function() {
	if(BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.on("window-all-closed", function() {
	app.quit();
});