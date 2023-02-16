import React from 'react';

import { Button } from './Button';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Example/Button",
  component: Button,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: "color" },
  },
  parameters: {
    a11y: {
      // Optional selector to inspect
      element: '#root',
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
            enabled: false
          }
        ],
      },
      options: {},
      manual: true,
    },
  }
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args) => <Button {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
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

// https://storybook.js.org/docs/react/writing-tests/accessibility-testing#story-level-a11y-configuration
export const EmptyButton = Button.bind({});
EmptyButton.args = {
  size: 'small',
};
EmptyButton.parameters = {
  a11y: {
    config: {
      rules: [
        {
          id: 'button-name',
          enabled: false,
        },
      ]
    }
  },
};