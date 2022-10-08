# Nightwatch Storybook Plugin

<p align=center>
  <img alt="Nightwatch.js Logo" src=".github/assets/nightwatch-logo.png" width=250 /><span>&nbsp;&nbsp;️&nbsp;&nbsp;</span> <img alt="React Logo" src=".github/assets/icon-storybook-default.png" width=200 />
</p>

The official **@nightwatch/storybook** plugin provides seamless integration between Nightwatch and Storybook for React. Nightwatch supercharges your Storybook by providing several important capabilities for component testing.

---

## Installation

The Storybook plugin for Nightwatch can be installed from NPM with:

```sh
npm i @nightwatch/storybook --save-dev
```

Then add the plugin in your `nightwatch.conf.js`:

```js
module.exports = {
  plugins: [
    //...
    '@nightwatch/storybook'      
  ]
}
```

### Prerequisites 
The plugin can be used in an **existing** Storybook project for React. If you're starting from scratch and you'd just like to check out some examples quickly, head over to our **storybook-example-project** which has a few basic React components.  

#### 1. Setup Storybook
In an existing React project, run:
```sh
npx storybook init
```
Head over to the Storybook [installation guide](https://storybook.js.org/docs/react/get-started/install) for more details.

We also recommend installing a few essential Storybook addons:
- [`@storybook/addon-interactions`](https://storybook.js.org/addons/@storybook/addon-interactions/) 
- [`@storybook/addon-a11y`](https://storybook.js.org/addons/@storybook/addon-a11y)
- [`@storybook/testing-react`](https://storybook.js.org/addons/@storybook/testing-react)


#### 2. Install Nightwatch

Install Nightwatch in the same project. This plugin requires Nightwatch v2.4 or higher.

```sh
npm i nightwatch chromedriver geckodriver --save-dev
```

`chromedriver` and `geckodriver` are needed to run tests in Chrome and Firefox respectively.

Head over to the Nightwatch [installation guide](https://nightwatchjs.org/guide/quickstarts/create-and-run-a-nightwatch-test.html) for more details.

--- 
## Configuration

The `@nightwatch/storybook` plugin supports a few configuration options: 
- Nightwatch can start/stop the storybook server for you, if needed (which can be useful when running in CI).
- Storybook url can be changed if storybook is running on a different hostname/port
- you can configure the location(s) to where the stories are located in the Nightwatch `src_folders` 

Edit your `nightwatch.conf.js` and configure it as follows:

```
module.exports = {
  src_folders: ['src/stories/*.stories.jsx'],
  
  '@nightwatch/storybook': {
    start_storybook: true,
    storybook_url: 'http://localhost:6006/'
  }
}
```

---
## Usage

### → Run your existing stories in Nightwatch

There is no need to start writing additional tests and import stories in them. Nightwatch supports the [Component Story Format](https://storybook.js.org/docs/react/api/csf) (CSF) so it is able to run the stories directly.

### → Extend component stories with new testing capabilities

Nightwatch is able to detect and run any existing interaction tests (using the `play()` function) and accessibility tests which are defined in the component story.

In addition, it provides the ability to extend the component story with its own testing capabilities, as follows:
- define a story-bound `test()` function;
- write test hooks (`before[Each]`/`after[Each]`) in the `default` story export.

Read more on:
- Storybook [interaction tests](https://storybook.js.org/docs/react/writing-tests/interaction-testing)
    - How to use the [play() function](https://storybook.js.org/docs/react/writing-stories/play-function)
- Storybook [accessibility testing](https://storybook.js.org/docs/react/writing-tests/accessibility-testing)
- [Component story format](https://storybook.js.org/docs/react/api/csf) (CSF)
    - [Component Story Format 3.0](https://storybook.js.org/blog/component-story-format-3-0/)
    
### Example
Considering a basic `Form.jsx` component, here's how its `Form.stories.jsx` story would look like, written in CSF and extended with Nightwatch functionality:

```jsx
// Form.stories.jsx
import { userEvent, within } from '@storybook/testing-library';
import Form from './Form.jsx';

export default {
  title: 'Form',
  component: Form,

  async before(browser) {
    console.log('before hook', browser.capabilities)
  },

  async beforeEach(browser) {
    console.log('beforeEach hook')
  },

  async after(browser) {
    console.log('after hook')
  },

  async afterEach(browser) {
    console.log('afterEach hook')
  }
}

const Template = (args) => <Form {...args} />;

// Component story for an empty form
export const EmptyForm = Template.bind({});

// Component story simulating filling in the form
export const FilledForm = Template.bind({});

FilledForm.play = async ({ canvasElement }) => {

  // Starts querying the component from its root element
  const canvas = within(canvasElement);

  // 👇 Simulate interactions with the component
  await userEvent.type(canvas.getByTestId('new-todo-input'), 'outdoors hike');
  await userEvent.click(canvas.getByRole('button'));
};

FilledForm.test = async (browser, { component }) => {
  // 👇 Run commands and assertions in the Nightwatch context
  await expect(component).to.be.visible;
}
```
---
## Run stories with Nightwatch

The example contains two stories and it can be run by Nightwatch as a regular test.

For the best developer experience available at the moment, we recommend to use Chrome, however you can use any of the other browsers that Nightwatch supports as well. 

```sh
npx nightwatch src/stories/Form.stories.jsx --env chrome
```

#### Running a specific story
You can run a specific story from a given `.stories.jsx` file by using the `--story` CLI argument.

Say you want to run only the `FilledForm` story. This will mount it and also execute the `play()` and `test()` functions accordingly:

```sh
npx nightwatch src/stories/Form.stories.jsx --env chrome --story=FilledForm
```

### Run stories in parallel
It may be useful to run the stories in parallel for optimizing the speed of execution using the existing Nightwatch option of running in parallel using test workers.

To run, for example, using 4 test worker processes (in headless mode):

```sh
npx nightwatch ./src/stories/**.stories.jsx --env chrome --parallel=4 --headless
```

The output should look as follows:

<details>

```
Launching up to 4 concurrent test worker processes...

 Running:  *.stories.@(js|jsx|ts|tsx)/Button.stories.jsx 
 Running:  *.stories.@(js|jsx|ts|tsx)/Form.stories.jsx 
 Running:  *.stories.@(js|jsx|ts|tsx)/Header.stories.jsx 
 Running:  *.stories.@(js|jsx|ts|tsx)/Input.stories.jsx 

┌ ────────────────── ✔  *.stories.@(js|jsx|ts|tsx)/Form.stories.jsx  ──────────────────────────────────────────────────────┐
│                                                                                                                          │
│                                                                                                                          │
│    [Form.stories.jsx component] Test Suite                                                                               │
│    ──────────────────────────────────────────────────────────────────────────────                                        │
│    Using: chrome (105.0.5195.125) on MAC OS X.                                                                           │
│                                                                                                                          │
│    – "Filled Form" story                                                                                                 │
│    ✔ Passed [ok]: "form--filled-form.FilledForm" story was rendered successfully.                                        │
│    ✔ Expected element <form--filled-form.FilledForm> to be visible (8ms)                                                 │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Form.stories.jsx [Form.stories.jsx component] "Filled Form" story (715ms)                │
│                                                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 Running:  *.stories.@(js|jsx|ts|tsx)/Page.stories.jsx 

┌ ────────────────── ✔  *.stories.@(js|jsx|ts|tsx)/Header.stories.jsx  ───────────────────────────────────────────┐
│                                                                                                                 │
│                                                                                                                 │
│    [Header.stories.jsx component] Test Suite                                                                    │
│    ───────────────────────────────────────────────────────────────────────────────                              │
│    Using: chrome (105.0.5195.125) on MAC OS X.                                                                  │
│    – "Logged In" story                                                                                          │
│    ✔ Passed [ok]: "example-header--logged-in.LoggedIn" story was rendered successfully.                         │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Header.stories.jsx [Header.stories.jsx component] "Logged In" story (764ms)     │
│                                                                                                                 │
│    – "Logged Out" story                                                                                         │
│    ✔ Passed [ok]: "example-header--logged-out.LoggedOut" story was rendered successfully.                       │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Header.stories.jsx [Header.stories.jsx component] "Logged Out" story (403ms)    │
│                                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌ ────────────────── ✔  *.stories.@(js|jsx|ts|tsx)/Input.stories.jsx  ───────────────────────────────────────────────────────┐
│                                                                                                                            │
│                                                                                                                            │
│    [Input.stories.jsx component] Test Suite                                                                                │
│    ───────────────────────────────────────────────────────────────────────────────                                         │
│    Using: chrome (105.0.5195.125) on MAC OS X.                                                                             │
│                                                                                                                            │
│    – "Input With Common Value" story                                                                                       │
│    ✔ Passed [ok]: "input--input-with-common-value.InputWithCommonValue" story was rendered successfully.                   │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Input.stories.jsx [Input.stories.jsx component] "Input With Common Value" story (855ms)    │
│    – "Input With Scoped Value" story                                                                                       │
│    ✔ Passed [ok]: "input--input-with-scoped-value.InputWithScopedValue" story was rendered successfully.                   │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Input.stories.jsx [Input.stories.jsx component] "Input With Scoped Value" story (303ms)    │
│    – "Input With Inline Value" story                                                                                       │
│    ✔ Passed [ok]: "input--input-with-inline-value.InputWithInlineValue" story was rendered successfully.                   │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Input.stories.jsx [Input.stories.jsx component] "Input With Inline Value" story (406ms)    │
│                                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌ ────────────────── ✔  *.stories.@(js|jsx|ts|tsx)/Button.stories.jsx  ──────────────────────────────────────────┐
│                                                                                                                │
│                                                                                                                │
│    [Button.stories.jsx component] Test Suite                                                                   │
│    ───────────────────────────────────────────────────────────────────────────────                             │
│    Using: chrome (105.0.5195.125) on MAC OS X.                                                                 │
│                                                                                                                │
│    – "Primary" story                                                                                           │
│    ✔ Passed [ok]: "example-button--primary.Primary" story was rendered successfully.                           │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Button.stories.jsx [Button.stories.jsx component] "Primary" story (840ms)      │
│    – "Secondary" story                                                                                         │
│    ✔ Passed [ok]: "example-button--secondary.Secondary" story was rendered successfully.                       │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Button.stories.jsx [Button.stories.jsx component] "Secondary" story (384ms)    │
│    – "Large" story                                                                                             │
│    ✔ Passed [ok]: "example-button--large.Large" story was rendered successfully.                               │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Button.stories.jsx [Button.stories.jsx component] "Large" story (361ms)        │
│    – "Small" story                                                                                             │
│    ✔ Passed [ok]: "example-button--small.Small" story was rendered successfully.                               │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Button.stories.jsx [Button.stories.jsx component] "Small" story (320ms)        │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌ ────────────────── ✔  *.stories.@(js|jsx|ts|tsx)/Page.stories.jsx  ─────────────────────────────────────────┐
│                                                                                                             │
│                                                                                                             │
│    [Page.stories.jsx component] Test Suite                                                                  │
│    ──────────────────────────────────────────────────────────────────────────────                           │
│    Using: chrome (105.0.5195.125) on MAC OS X.                                                              │
│    – "Logged Out" story                                                                                     │
│    ✔ Passed [ok]: "example-page--logged-out.LoggedOut" story was rendered successfully.                     │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Page.stories.jsx [Page.stories.jsx component] "Logged Out" story (489ms)    │
│                                                                                                             │
│    – "Logged In" story                                                                                      │
│    ✔ Passed [ok]: "example-page--logged-in.LoggedIn" story was rendered successfully.                       │
│    ✔ *.stories.@(js|jsx|ts|tsx)/Page.stories.jsx [Page.stories.jsx component] "Logged In" story (437ms)     │
│                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ✨ PASSED. 13 total assertions (4.483s)

```

</details>


## Preview stories using Nightwatch

Nightwatch provides the ability to run a `.stories.jsx` file in preview mode (using the `--preview` CLI argument) which would only open the Storybook renderer and pause the execution indefinitely. 

This can be useful during development, since the Storybook renderer has the ability to automatically reload the component via its built-in Hot Module Replacement (HMR) functionality. 

To launch the `FilledForm` story in preview mode, run:
<details>

```sh
npx nightwatch src/stories/Form.stories.jsx --env chrome --story=FilledForm --preview 
```
</details>

Pass the `--devtools` flag to open the Chrome Devtools:

<details>

```sh
npx nightwatch src/stories/Form.stories.jsx --env chrome --story=FilledForm --preview --devtools
```
</details>

You can of course use the Nightwatch built-in parallelism to open the story in both Firefox and Chrome:

<details>

```sh
npx nightwatch src/stories/Form.stories.jsx --env chrome,firefox --story=FilledForm --preview 
```
</details>

## Debugging stories using Nightwatch

In addition to previewing the story, it's also possible to use Nightwatch to debug the story. To do this, enable the `--debug` and `--devtools` CLI flags and use the `debugger` to add breakpoints inside the `play()` function.

### Example:

```jsx
// Form.stories.jsx
import { userEvent, within } from '@storybook/testing-library';
import Form from './Form.jsx';

export default {
  title: 'Form',
  component: Form,
}

const Template = (args) => <Form {...args} />;

// Component story for an empty form
export const EmptyForm = Template.bind({});

// Component story simulating filling in the form
export const FilledForm = Template.bind({});

FilledForm.play = async ({ canvasElement }) => {

  // Starts querying the component from its root element
  const canvas = within(canvasElement);
  
  debugger;
  
  // 👇 Simulate interactions with the component
  await userEvent.type(canvas.getByTestId('new-todo-input'), 'outdoors hike');
  await userEvent.click(canvas.getByRole('button'));
};

FilledForm.test = async (browser, { component }) => {
  // 👇 Run commands and assertions in the Nightwatch context
  await expect(component).to.be.visible;
}
```

Run the example and observe the breakpoint in the Chrome devtools console.

```sh
npx nightwatch src/stories/Form.stories.jsx --env chrome --devtools --debug --story=FilledForm 
```

<details>
<img src=".github/assets/debugger.png" alt="Screenshot of the Chrome Devtools debugger paused at a breakpoint" width="800px">
</details>

You can also use the integrated Nightwatch debug console to issue commands from Nightwatch.

---
## Accessibility testing (A11y) with Storybook + Nightwatch

Both Storybook and Nightwatch rely internally on the same accessibility testing tools developed by [Deque Systems](https://www.deque.com/axe/) and published in NPM as the [`axe-core`](https://www.npmjs.com/package/axe-core) library.

To get started with in A11y testing in Storybook, install the addon:
```sh
npm i @storybook/addon-a11y --save-dev 
```

Add this line to your `main.js` file (create this file inside your Storybook config directory if needed).
```js
module.exports = {
  addons: ['@storybook/addon-a11y'],
};
```

More details can be found on Storybook docs:
- [storybook-addon-a11y](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Accessibility tests in Storybook](https://storybook.js.org/docs/react/writing-tests/accessibility-testing)

### Example
Consider the bundled example `Button.jsx` component and `Button.stories.jsx` which come pre-installed when you setup Storybook. 

Add the following rules for accessibility tests:

```jsx
// Button.stories.jsx

import React from 'react';
import { Button } from './Button';

export default {
  title: "Example/Button",
  component: Button,
  argTypes: {
    backgroundColor: { control: "color" },
  },
  parameters: {
    a11y: {
      // Optional selector to inspect
      element: '#root',
      // Show the complete Acccessibilty test report (by default, only rule violations will be shown)
      verbose: false,
      config: {
        rules: [
          {
            // The autocomplete rule will not run based on the CSS selector provided
            id: 'autocomplete-valid',
            selector: '*:not([autocomplete="nope"])',
          },
          {
            // Setting the enabled option to false will disable checks for this particular rule on all stories.
            id: 'image-alt',
            enabled: false,
          },
          {
            id: 'input-button-name',
            enabled: true
          },
          {
            id: 'color-contrast',
            enabled: true
          }
        ],
      },
      options: {},
      manual: true,
    },
  }
};

const Template = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Button',
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: 'Button',
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  label: 'Button',
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  label: 'Button',
};

```

Nightwatch will automatically pick up the A11y rules from the story config and use them to run its own accessibility test commands. 

One of the Button component story will fail the `"color-contrast"` accessibility rule as defined by the Axe-core library. 

Run the following to see the result:

```sh
npx nightwatch src/stories/Button.stories.jsx -e chrome
```

The output from Nightwatch should be:

<details>

```
  ️TEST FAILURE (2.947s):  
   - 1 assertions failed; 4 passed

   ✖ 1) Button.stories
   – "Primary" story (733ms)

   → ✖ NightwatchAssertError
   There are accessibility violations; please see the complete report for details.

    Read More : 
        https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md 


Accessibility report for: example-button--primary.Primary

Accessibility violations for: example-button--primary.Primary
┌───────────────────────┬────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬────────────┐
│ ID                    │ Impact     │ Description                                                                                                       │ Nodes      │
│ ───────────────────── │ ────────── │                                                                                                                   │ ────────── │
│ color-contrast        │ serious    │ Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds           │ 1          │
│ ───────────────────── │ ────────── │                                                                                                                   │ ────────── │
│ Target                             │ Html                                                                                                              │ Violations │
│ [".storybook-button"]              │ <button type="button" class="storybook-button storybook-button--medium storybook-button--primary">Button</button> │            │
│                                                                                                                                                                     │
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```
</details>

To view the entire report (which includes all the eveluated rules), pass `verbose: true` in the story parameters:

```jsx
// Button.stories.jsx

import React from 'react';
import { Button } from './Button';

export default {
  parameters: {
    a11y: {
      // Show the complete Acccessibilty test report (by default, only rule violations will be shown)
      verbose: false,
      // ...
    }
  }
}
```

Example output:
<details>

```
Accessibility report for: example-button--primary.Primary
┌───────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────┐
│ Rule                  │ Description                                                                                                                                           │ Nodes   │
│ ───────────────────── │ ──────────                                                                                                                                            │ ─────── │
│ aria-hidden-body      │ Ensures aria-hidden='true' is not present on the document body.                                                                                       │ 1       │
│ aria-hidden-focus     │ Ensures aria-hidden elements are not focusable nor contain focusable elements                                                                         │ 1       │
│ button-name           │ Ensures buttons have discernible text                                                                                                                 │ 1       │
│ duplicate-id          │ Ensures every id attribute value is unique                                                                                                            │ 4       │
│ nested-interactive    │ Ensures interactive controls are not nested as they are not always announced by screen readers or can cause focus problems for assistive technologies │ 1       │
│ region                │ Ensures all page content is contained by landmarks                                                                                                    │ 2       │
│ ───────────────────── │ ────────────────────────                                                                                                                              │ ─────── │
│ Target                │ Html                                                                                                                                                            │
│ ["body"]              │ <body class="sb-main-padded sb-show-main">                                                                                                                      │
│ ["table"]             │ <table aria-hidden="true" class="sb-argstableBlock">                                                                                                            │
│ [".storybook-button"] │ <button type="button" class="storybook-button storybook-button--medium storybook-button--primary">Button</button>                                               │
│ ["#error-message"]    │ <pre id="error-message" class="sb-heading"></pre>                                                                                                               │
│ ["#error-stack"]      │ <code id="error-stack"></code>                                                                                                                                  │
│ ["#root"]             │ <div id="root"><button type="button" class="storybook-button storybook-button--medium storybook-button--primary">Button</button></div>                          │
│ ["#docs-root"]        │ <div id="docs-root" hidden="true"></div>                                                                                                                        │
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

Accessibility violations for: example-button--primary.Primary
┌───────────────────────┬────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬────────────┐
│ ID                    │ Impact     │ Description                                                                                                       │ Nodes      │
│ ───────────────────── │ ────────── │                                                                                                                   │ ────────── │
│ color-contrast        │ serious    │ Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds           │ 1          │
│ ───────────────────── │ ────────── │                                                                                                                   │ ────────── │
│ Target                             │ Html                                                                                                              │ Violations │
│ [".storybook-button"]              │ <button type="button" class="storybook-button storybook-button--medium storybook-button--primary">Button</button> │            │
│                                                                                                                                                                     │
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

</details>

## License
MIT
