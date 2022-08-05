import metadata from '../storybook/metadata.js';
import stories, { CSFDescription } from '../storybook/stories.js';

interface NightwatchBrowser {
	readonly renderStory: (id: string, viewMode: string) => Promise<object>;
}

interface TestDescription {
	readonly data: CSFDescription[] | (() => CSFDescription[] | Promise<CSFDescription[]>);
	readonly name: string | ((exportName: string) => string);
	readonly filter: RegExp | ((modulePath: string) => boolean);
	readonly createTest:
		(options: {
			modulePath: string,
			publicUrl: string,
			exportName: string,
			data: readonly CSFDescription[]
		}) =>
			Promise<(browser: NightwatchBrowser) => void | Promise<void> | object | Promise<object>>;
	readonly exports?: (
		exports: readonly string[],
		modulePath: string
	) => Promise<readonly string[]> | readonly string[];
}

const normalizeExportName = (name: string): string =>
	name.replace(/ /g, '');

export default async () => Promise.all(
	metadata()
		.stories
		.map((storyPath) => stories(storyPath)))
		.then((stories) => stories
			.map((moduleDescription): TestDescription => ({
				name: (exportName: string) => `"${exportName}" should render`,
				data: () =>
					moduleDescription.map(({ name, ...rest }) =>
						({ name: normalizeExportName(name), ...rest })
					),
				filter: (modulePath) =>
					moduleDescription.some(({ storyPath }) => modulePath === storyPath),
				exports: () => moduleDescription.map(({ name }) => normalizeExportName(name)),
				createTest: async ({ exportName, data }) => {
					const { id, viewMode } = data.find(({ name }) => name === exportName)!;

					return async (browser) => {
						await browser.renderStory(id, viewMode);
					}
				}
			}))
		);
