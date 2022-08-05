/**
 * @file Defines a command for Nightwatch that may be called on
 *  the _browse_ object and navigates to the story page.
 *
 *  @module renderStory
 */
import { StoryId } from "@storybook/store";
import { NightwatchAPI, NightwatchClient } from "nightwatch";

declare module "nightwatch" {
	interface NightwatchClient {
		argv: {
			debug: boolean;
		};
	}
}

declare global {
	interface Window {
		readonly __STORYBOOK_ADDONS_CHANNEL__: any;
	}
}

interface ClientScriptOptions {
	readonly baseUrl: string;
	readonly storyId: string;
	readonly viewMode: string;
}

interface DoneResult {
	readonly event: string;
	readonly value: StorybookError | Element | null;
}

interface StorybookError {
	readonly name: string;
	readonly message: string;
}

type DoneCallback = (result: DoneResult) => void;

type ClientScript = (options: ClientScriptOptions, done: DoneCallback) => void;

export default class RenderStoryCommand {
	declare api: NightwatchAPI;
	declare client: NightwatchClient;

	async command(storyId: StoryId, viewMode: string): Promise<NightwatchAPI> {
		return this.api
			.navigateTo(this._getStoryUrl(storyId, viewMode))
			.executeAsyncScript(this._getClientScript(), [
				{ baseUrl: this.api.launchUrl, storyId, viewMode },
			], function (result) {
				const value = result.value as unknown as DoneResult;

				if (value.value === null) {
					// Propagate an error to the Nightwatch, so it can fail a test and display it?
					throw new Error(
						"Could not render the story. Run nightwatch with --devtools and --debug flags (Chrome only) and investigate the error in the browser console.",
					);
				}

				if (
					"name" in value.value && value.value
						.name === "StorybookTestRunnerError"
				) {
					throw new Error(value.value.message);
				}
			})
			.pause(this.client.argv.debug ? 0 : 1);
	}

	/**
   * Returned function is going to be executed in the browser,
   * so it will have access to the _window_ object. But the function
   * is created on the Node environment, though it won't be preserved.
   * That's why the function has to be pure and receive all necessary
   * data through parameters only. Or obtain it from the _window_.
   */
	_getClientScript(): ClientScript {
		return function (options, done) {
			var stamp: NodeJS.Timeout | null = null;

			var renderedEvent =
				options.viewMode === "docs" ? "docsRendered" : "storyRendered";

			function waitFor(value: DoneResult): void {
				if (
					value.value === null || (value.value as { name: string })
						.name === "StorybookTestRunnerError"
				) {
					done(value);
					return;
				}

				if (stamp !== null) {
					clearTimeout(stamp);
				}

				stamp = setTimeout(function () {
					done(value);
				}, 100);
			}

			function StorybookTestRunnerError(errorMessage: string): StorybookError {
				var name = "StorybookTestRunnerError";

				var finalStoryUrl =
					options.baseUrl +
					"?path=/story/" +
					options.storyId +
					"&addonPanel=storybook/interactions/panel";

				var message =
					"\nAn error occurred in the following story. Access the link for full output:\n" +
					finalStoryUrl +
					"\n\nMessage:\n " +
					errorMessage;

				return {
					name: name,
					message: message,
				};
			}

			var channel = window.__STORYBOOK_ADDONS_CHANNEL__;

			if (!channel) {
				throw StorybookTestRunnerError(
					"The test runner could not access the Storybook channel. Are you sure the Storybook is running correctly in that URL?",
				);
			}

			function getRootChild(): Element | null {
				var root = document.querySelector("#root");

				if (!root) return null;

				return root.firstElementChild;
			}

			channel.on(renderedEvent, function () {
				waitFor({
					event: renderedEvent,
					value: getRootChild(),
				});
			});
			channel.on("storyUnchanged", function () {
				waitFor({
					event: "storyUnchanged",
					value: getRootChild(),
				});
			});
			channel.on("storyErrored", function (
				error: Error & { description: string },
			) {
				waitFor({
					event: "storyErrored",
					value: StorybookTestRunnerError(error.description),
				});
			});
			channel.on("storyThrewException", function (error: Error) {
				waitFor({
					event: "storyThrewException",
					value: StorybookTestRunnerError(error.message),
				});
			});
			channel.on("storyMissing", function (id: StoryId) {
				id === options.storyId && waitFor({
					event: "storyMissing",
					value: StorybookTestRunnerError(
						"The story was missing when trying to access it.",
					),
				});
			});
			channel.on("playFunctionThrewException", function (error: Error) {
				waitFor({
					event: "playFunctionThrewException",
					value: StorybookTestRunnerError(error.message),
				});
			});

			channel.emit("forceRemount", {
				storyId: options.storyId,
				viewMode: options.viewMode,
			});
		};
	}

	/** Builds the URL which Nightwatch is going to visit and test. */
	_getStoryUrl(storyId: StoryId, viewMode: string): string {
		return `/iframe.html?viewMode=${viewMode}&id=${storyId}`;
	}
}
