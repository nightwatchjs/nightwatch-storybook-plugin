import { StoryId } from "@storybook/store";
import { NightwatchAPI } from "nightwatch";

export default class OpenStorybookCommand {
	declare api: NightwatchAPI;

	command(storyId: StoryId): NightwatchAPI {
		return this.api.navigateTo(this._getStoryBookUrl(storyId));
	}

	_getStoryBookUrl(storyId: StoryId): string {
		return `/?path=/story/${storyId}`;
	}
}
