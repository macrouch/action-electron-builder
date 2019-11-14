const { execSync } = require("child_process");

/**
 * Logs to the console
 */
const log = msg => console.log(`\n${msg}`); // eslint-disable-line no-console

/**
 * Exits the current process with an error code and message
 */
const exit = msg => {
	console.error(msg);
	process.exit(1);
};

/**
 * Executes the provided shell command and redirects stdout/stderr to the console
 */
const run = cmd => execSync(cmd, { encoding: "utf8", stdio: "inherit" });

/**
 * Determines the current operating system (one of ["mac", "windows", "linux"])
 */
const getPlatform = () => {
	switch (process.platform) {
		case "darwin":
			return "mac";
		case "win32":
			return "windows";
		default:
			return "linux";
	}
};

/**
 * Parses the environment variable with the provided name. If `required` is set to `true`, the
 * program exits if the variable isn't defined
 */
const getEnvVariable = (name, required = false) => {
	const value = process.env[`INPUT_${name.toUpperCase()}`];
	if (required && (value === undefined || value === null || value === "")) {
		exit(`"${name}" input variable is not defined`);
	}
	return value;
};

/**
 * Installs NPM dependencies and builds/releases the Electron app
 */
const runAction = () => {
	const platform = getPlatform();
	const release = getEnvVariable("release") === "true";

	// Copy "github_token" input variable to "GH_TOKEN" env variable (required by `electron-builder`)
	process.env.GH_TOKEN = getEnvVariable("github_token", true);

	// Require code signing certificate and password if building for macOS. Export them to environment
	// variables (required by `electron-builder`)
	if (platform === "mac") {
		process.env.CSC_LINK = getEnvVariable("mac_certs", true);
		process.env.CSC_KEY_PASSWORD = getEnvVariable("mac_certs_password", true);
	}

	log("Installing dependencies…");
	run("yarn");

	// TODO: Only run build script if it exists
	log("Building app…");
	run("yarn build");

	log(`${release ? "Releasing" : "Building"} the Electron app…`);
	run(`yarn run electron-builder --${platform} ${release ? "--publish always" : ""}`);
};

runAction();