import chalk from "chalk";
import dedent from "dedent";

import { RUNNER_ID } from "./constants.js";

enum Level {
	Info,
	Error,
}

const formatMessage = (
	statics: TemplateStringsArray,
	values: readonly string[],
	level: Level,
): string => (
	dedent(
		statics
			.reduce(
				(all, part, index) => all + part + (values[index] ?? ""),
				`${
					Level.Info === level ? chalk.bold(RUNNER_ID) : chalk.bgRedBright.bold(
						RUNNER_ID,
					)
				} `,
			)
			.split("\n")
			.map(
				(line) =>
					line.includes(RUNNER_ID) ? line : `${"".padStart(
						RUNNER_ID.length,
						" ",
					)} ${line}`,
			)
			.join("\n"),
	)
);

export interface Logger {
	readonly info: (
		statics: TemplateStringsArray,
		...values: readonly string[]
	) => void;
	readonly error: (
		statics: TemplateStringsArray,
		...values: readonly (string | Error)[]
	) => void;
}

export default {
	info: (statics, ...values) =>
		console.log(formatMessage(statics, values, Level.Info)),
	error: (statics, ...values) =>
		console.error(
			formatMessage(
				statics,
				values.map(
					(value) =>
						value instanceof Error ? `${chalk.red(value.name)}: ${chalk.dim(
							value.message,
						)}.\n` + `Stack trace:\n${value.stack}` : value,
				),
				Level.Error,
			),
		),
} as Logger;
