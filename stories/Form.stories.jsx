import { userEvent, within } from '@storybook/testing-library';
import Form from './Form.jsx';

export default {
  title: 'Form',
  component: Form,


  async setup(browser) {
    browser.globals.calls = 0;
  },

  async preRender(browser, context) {
    browser.globals.calls++;
  },

  async postRender(browser, context) {
    browser.globals.calls++;
  },

  async teardown(browser) {
    await expect(browser.globals.calls).to.equal(4);
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


// 👇 Run commands and assertions in the Nightwatch context
FilledForm.test = async (browser, { component }) => {
  await expect(component).to.be.visible;
}
