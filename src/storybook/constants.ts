// @ts-ignore - after building the TS `cli` gets rid of one nested level.
import { name } from "../package.json";

/** Name of the CLI. */
export const RUNNER_NAME: string = name;

/** It is used in logs to mark the origin. */
export const RUNNER_ID = `[${RUNNER_NAME}]`;
