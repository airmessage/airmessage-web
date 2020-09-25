const SentryCli = require('@sentry/cli');

async function createReleaseAndUpload() {
	const cli = new SentryCli();
	const release = "airmessage-web@" + process.env.npm_package_version;
	
	try {
		console.log("Creating sentry release " + release);
		await cli.releases.new(release);
		console.log("Uploading source maps");
		await cli.releases.uploadSourceMaps(release, {
			include: ["build/static/js"],
			urlPrefix: "~/static/js",
			rewrite: false,
		});
		console.log("Finalizing release");
		await cli.releases.finalize(release);
	} catch(exception) {
		console.error("Source maps uploading failed:", exception);
	}
}

createReleaseAndUpload();