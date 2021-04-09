# AirMessage for web

![AirMessage running on Microsoft Edge](README/windows-web.png)

AirMessage lets people use iMessage on the devices they like.
**AirMessage for web** brings iMessage to modern web browsers over a WebSocket proxy.
Production builds are hosted on [web.airmessage.org](https://web.airmessage.org).

Other AirMessage repositories:
[Server](https://github.com/airmessage/airmessage-server) |
[Android](https://github.com/airmessage/airmessage-android) |
[Connect (community)](https://github.com/airmessage/airmessage-connect-java)

## Getting started

To build AirMessage for web, you will need [Node.js](https://nodejs.org).

AirMessage for web uses [React](https://reactjs.org), [Electron](https://electronjs.org), and [TypeScript](https://www.typescriptlang.org). If you're not familiar with these tools, they all have great introductory guides:
- [React - Getting started](https://reactjs.org/docs/getting-started.html)
- [Electron - Quick start](https://www.electronjs.org/docs/tutorial/quick-start)
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

AirMessage for web uses a configuration file to associate with online services like Firebase and Sentry.
The app will not build without a valid configuration, so to get started quickly, you can copy the `src/secrets.default.ts` file to `src/secrets.ts` to use a pre-configured Firebase project, or you may provide your own Firebase configuration file.

To launch a development server, run `npm start`. To build a production-optimized bundle, run `npm run build`.

## File structure outline

- `/public` holds static files that are copied in at build time. It also holds the app's entry point, `index.html`.
- `/src` holds shared source files - where most of the UI logic resides.
- `/browser` holds all browser-specific code. This includes logic for authenticating with Firebase and using AirMessage's WebSocket proxy.
- `/electron-main` holds the code that runs on Electron's main process.
- `/electron-renderer` holds all code that runs on Electron's renderer process. This includes UI and logic for establishing direct TCP connections.
- `/native` holds platform-specific C++ code, used to provide deeper system integration when running under Electron.
- Builds are located in `/build` for web builds, and `/dist` for Electron builds.

`/browser` and `/electron-renderer` are aliased to the import prefix `/platform-components` at build time, depending on the build target.
As such, components that are imported from `/src` must be available in both directories. If you're adding or modifying any files in these build-specific directories, please ensure that they are imported properly with the `/platform-components` alias.

Any extra files under build-specific directories (`/browser` or `/electron-renderer`) that aren't used by `/src` should be under a `private` subdirectory.

## Building and running for AirMessage Connect

In order to help developers get started quickly, we host a separate open-source version of AirMessage Connect at `connect-open.airmessage.org`.
The default configuration is pre-configured to authenticate and connect to this server.
Since this version of AirMessage Connect is hosted in a separate environment from official servers, you will have to be running a version of AirMessage Server that also connects to the same AirMessage Connect server.

We kindly ask that you do not use AirMessage's official Connect servers with any unofficial builds of AirMessage-compatible software.

## Developing and running Electron builds

![AirMessage running on Electron](README/windows-electron.png)

AirMessage has recently acquired support for running in Electron environments, enabling direct connections back to servers.
However, this is still in development and still lacks some features that would be needed for day-to-day use.

Builds for web browsers and Electron will be kept in sync, so any changes made to files under the `/src` directory will make their way into the web app as well.

To launch Electron in a development environment with fast refresh, run `npm run electron-start`.
To build Electron for your platform, run `npm run electron-distribute`.

### Enabling native integration on Windows 10

AirMessage takes advantage of Node's [C++ addons](https://nodejs.org/api/addons.html) to utilize [C++/WinRT](https://docs.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/) for a more native experience.
This functionality is included in `native/airmessage-winrt`, which is a separate module designed exclusively to expose specific WinRT functionality to the main JavaScript app.

`native/airmessage-winrt` is included as an optional dependency, so it will be skipped if you don't have the correct build environment.
AirMessage's Electron builds will still function without it, though your builds will miss out on native functionality.

To properly compile and install `native/airmessage-winrt`, please install the Windows 10 SDK, either [through the Visual Studio installer](https://developer.microsoft.com/en-us/windows/downloads/) or [as a standalone package](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk/).
Then, run `npm install` again, and watch the console for any errors.

---

Thank you for your interest in contributing to AirMessage!
You're helping to shape the future of an open, secure messaging market.
Should you have any questions, comments, or concerns, please shoot an email to [hello@airmessage.org](mailto:hello@airmessage.org).