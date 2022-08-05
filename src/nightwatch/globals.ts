import { spawn } from "child_process";
import { resolve } from "path";
import { cwd, kill, exit } from "process";

import chalk from "chalk";
import waitOn from "wait-on";
import { NightwatchAPI } from "nightwatch";

import checkStorybook from "./_utils/checkStorybook.js";
// @ts-ignore
import { name } from '../package.json';

interface NightwatchStorybookPluginOptions {
	readonly port?: number;
	readonly start_storybook?: boolean;
}

const STORYBOOK_PORT_RE = /(?:localhost|127.0.0.1):(\d+)\/?$/;

let storybookPid: number | null = null;

// We have to use CommonJS export here because Babel changes
// `export default` to `exports.default` which cannot be consumed by Nightwatch.
// TODO: revisit it when Nightwatch adds support for the `__esModule` marker.
module.exports = {
	async before(this: {
		settings: NightwatchAPI & { '@nightwatch/storybook'?: NightwatchStorybookPluginOptions };
	}) {
		const pluginSettings = this.settings[name as '@nightwatch/storybook'];

		let launchUrl: string = this.settings.launch_url;
		const shouldRunStorybook = Boolean(
			pluginSettings?.start_storybook,
		);

		if (shouldRunStorybook) {
			let storybookPort = pluginSettings?.port;

			if (!storybookPort) {
				const [, port = "6006"] = STORYBOOK_PORT_RE.exec(launchUrl) ?? [];

				storybookPort = Number(port);
			}

			// launch_url option can contain a link to the remote Storybook
			// instance. In that case, we should make sure that we are going
			// to run Storybook locally.
			launchUrl = `http://localhost:${storybookPort}`;

			console.log(`Starting storybook at: ${launchUrl}`);

			storybookPid =
				spawn(resolve("node_modules/.bin/start-storybook"), [
					"-p",
					String(storybookPort),
				], {
					cwd: cwd(),
				}).pid ?? null;

			await waitOn({
				resources: [launchUrl],
			});
		} else {
			const isStorybookRunning = await checkStorybook(launchUrl);

			if (!isStorybookRunning) {
				console.error(
					`Storybook is not running at ${chalk.bold(launchUrl)}.\n\n` +
						"You can start it by yourself or provide a setting and Nightwatch will start it for you:\n\n" +
						chalk.bold.gray(
							"\tplugins: ['@nightwatch/storybook'],\n" +
								"\t'@nightwatch/storybook': {\n" +
								"\t  start_storybook: true,\n" +
								"\t  port: 6006 // default\n" +
								"\t}",
						),
				);

				exit(1);
			}
		}
	},

	async after() {
		if (storybookPid) {
			kill(storybookPid);
		}
	},
};
