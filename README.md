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

AirMessage for web uses [React](https://reactjs.org) and [TypeScript](https://www.typescriptlang.org). If you're not familiar with these tools, they both have great introductory guides:
- [React - Getting started](https://reactjs.org/docs/getting-started.html)
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

AirMessage for web uses a configuration file to associate with online services like Firebase and Sentry.
The app will not build without a valid configuration, so to get started quickly, you can copy the `src/secrets.default.ts` file to `src/secrets.ts` to use a pre-configured Firebase project, or you may provide your own Firebase configuration file.

To launch a development server, run `npm start`. To build a production-optimized bundle, run `npm run build`.

## Building and running for AirMessage Connect

In order to help developers get started quickly, we host a separate open-source version of AirMessage Connect at `connect-open.airmessage.org`.
The default configuration is pre-configured to authenticate and connect to this server.
Since this version of AirMessage Connect is hosted in a separate environment from official servers, you will have to be running a version of AirMessage Server that also connects to the same AirMessage Connect server.

We kindly ask that you do not use AirMessage's official Connect servers with any unofficial builds of AirMessage-compatible software.

---

Thank you for your interest in contributing to AirMessage!
You're helping to shape the future of an open, secure messaging market.
Should you have any questions, comments, or concerns, please shoot an email to [hello@airmessage.org](mailto:hello@airmessage.org).
