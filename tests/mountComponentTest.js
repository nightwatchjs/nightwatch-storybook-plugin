describe('buttons', function () {
  it('tests', async function (browser) {
    const element = await browser.mountComponent('stories/Button.stories.jsx');

    // returns the #docs-root element from the iframe
    expect(element).to.be.visible;
  });
});