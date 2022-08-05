import { cwd, exit } from "process";
import { readdirSync } from "fs";
import { join, resolve } from "path";

import chalk from "chalk";
import {
	serverRequire,
	normalizeStories,
	type StorybookConfig,
} from "@storybook/core-common";

import memo from "../utils/memo.js";
import logger from "./logger.js";

const storybookConfigDir = ".storybook";

const resolveStorybookConfig = memo(
	(): StorybookConfig => {
		const storybookMainConfig = serverRequire(
			join(resolve(storybookConfigDir), "main"),
		);

		if (!storybookMainConfig) {
			logger.error`
				Could not load main.js in ${storybookConfigDir}. Is the config directory correct?
				You can change it by using ${chalk.bold(
				"--storybook-config-dir <path-to-dir>",
			)} option.
			`;

			exit(1);
		}

		return storybookMainConfig;
	},
);

const directoriesToSkip = [".git", "node_modules"];

/**
 * Walks all directories in the project and gathers all files' paths
 * that passes the predicate.
 */
const readFiles = (
	directory: string,
	shouldInclude: (filePath: string) => boolean,
): readonly string[] =>
	readdirSync(resolve(directory), {
		withFileTypes: true,
	})
		.filter((dirent) => !directoriesToSkip.includes(dirent.name))
		.flatMap(
			(dirent) =>
				dirent.isDirectory()
					? readFiles(join(directory, dirent.name), shouldInclude)
					: shouldInclude(join(directory, dirent.name))
						? join(directory, dirent.name)
						: null,
		)
		.filter(Boolean) as readonly string[];

/** Resolves the stories' metadata. */
export default memo(() => {
	const workingDir = cwd();

	const storybookConfig = resolveStorybookConfig();

	const normalizedStoriesEntries = normalizeStories(storybookConfig.stories, {
		configDir: storybookConfigDir,
		workingDir,
	}).map(
		(specifier) => ({
			...specifier,
			importPathMatcher: new RegExp(specifier.importPathMatcher),
		}),
	);

	return {
		stories: readFiles(
			".",
			(path) =>
				normalizedStoriesEntries.some(
					({ importPathMatcher }) => importPathMatcher.test(`./${path}`),
				),
		),
		normalizedStoriesEntries
	}
});
