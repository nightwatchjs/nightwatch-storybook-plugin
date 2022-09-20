module.exports = class OpenStorybookCommand {
  command(storyId) {
    return this.api.navigateTo(this._getStoryBookUrl(storyId));
  }

  _getStoryBookUrl(storyId) {
    return `/?path=/story/${storyId}`;
  }
};
