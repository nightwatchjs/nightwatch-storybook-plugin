import { exit } from "process";
import { basename, resolve } from "path";

import { userOrAutoTitle } from '@storybook/store';
import { NormalizedStoriesSpecifier } from '@storybook/core-common';
import { readCsfOrMdx, type CsfFile } from "@storybook/csf-tools";

import logger from "./logger.js";
import metadata from './metadata.js';

const makeTitle = (filePath: string, storiesSpecifier: NormalizedStoriesSpecifier[]) =>
	(userTitle: string): string => userOrAutoTitle(
		basename(filePath), storiesSpecifier, userTitle
	);

/** Parses a CSF file and exports the meta information. */
const parseCSF = async (
	filePath: string,
): Promise<CsfFile> => {
	try {
		return (await readCsfOrMdx(filePath, {
			makeTitle: makeTitle(filePath, metadata().normalizedStoriesEntries),
		})).parse();
	} catch (error: unknown) {
		logger.error`
			The "${filePath}" story contains a syntax mistake.
			
			${error instanceof Error ? error : String(error)}
		`;
		exit(1);
	}
};

export interface CSFDescription {
	readonly id: string;
	readonly name: string;
	readonly viewMode: string;
	readonly storyPath: string;
}

export default async (filePath: string): Promise<readonly CSFDescription[]> => {
	const csf = await parseCSF(filePath);

	return Object.entries(csf._stories)
		.map(([key, { id, name, parameters }]) => {
			if (key === "__page") {
				// If key is default, current story is in docs mode, which
				// doesn't have to be tested.
				return null;
			}

			const viewMode =
				parameters.viewMode ?? (
					(Boolean(parameters.docs) && !parameters.docs.disabled) ? "docs" : "story"
				);

			return {
				id,
				name,
				viewMode,
				storyPath: resolve(filePath),
			};
		})
		.filter(Boolean) as CSFDescription[];
};
