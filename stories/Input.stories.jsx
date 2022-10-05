import Input from './Input.jsx';

export default {
	title: 'Input',
	component: Input,
	args: {
		value: 'I am a common value'
	}
}

export const InputWithCommonValue = ({ value }) => <Input value={value} />;

export const InputWithScopedValue = Object.assign(
	({ value }) => <Input value={value} />,
	{
		args: {
			value: 'I am a scoped value'
		}
	}
);

export const InputWithInlineValue = () => <Input value="Hello" />;