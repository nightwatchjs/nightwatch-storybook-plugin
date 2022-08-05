# Nightwatch test runner for Storybook

This project wouldn't exist without the [Storybook's test-runner](https://github.com/storybookjs/test-runner).

## Installation

```shell
npm i -D @nightwatch/storybook
```

## Usage

The package aims to help developers creating tests for their stories and test them with [Nightwatch](https://nightwatchjs.org).

### Plugin

Primary intention of this package is to allow Nightwatch to test Storybook stories and catch render errors and errors from _play_ function.

You can register it as follows in Nightwatch configuration file:

```js
module.exports = {
  plugins: ["@nightwatch/storybook"],
  "@nightwatch/storybook": {
    startStorybook: true, // default is _false_
    port: 6006 // default
  }
}
```

The example shows also how you can define options for the plugin.

Plugin registers two custom commands:

1. `renderStory`(synchronous) - navigates to the story url and checks if it doesn't fail.
2. `openStorybook`(synchronous) - open the Storybook UI in testing browser, so you can inspect it or do some visual checks.

Plugin allows you to omit writing tests completely. All you need it at least 
one story in the project and optional [play](https://storybook.js.org/docs/react/essentials/interactions#play-function-for-interactions)
function and the `test` function that supported by the Nightwatch.

### test

This function is called on the Node environment and doesn't conflict with the
Storybook functionality. It accepts the [browser](https://nightwatchjs.org/api/#the-browser-object) object as the first 
parameter. And that is your test suite.

Nightwatch checks whether the component is rendered without errors, listens 
for errors in the `play` functions and executes `test` function against 
attached stories. Very convenient, isn't it?

## Word from author

Have fun ✌️