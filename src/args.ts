import { parseArgs } from "node:util";

import { ArgsInfo } from "./types/args";
import { schema } from "./resources/schema";

function getArgs(): ArgsInfo {
  try {
    const args: ArgsInfo = parseArgs({
      options: schema,
      strict: true,
      allowPositionals: true,
    });
    // eslint-disable-next-line prefer-const
    let { values, positionals } = args;

    values = Object.fromEntries(
      Object.entries(values).map(([key, val]) => {
        if (schema[key].validator) {
          return [key, schema[key].validator(val)];
        }

        return [key, val];
      }),
    );

    return {
      values,
      positionals: Array.from(new Set(positionals)),
    };
  } catch {
    return {
      values: {},
      positionals: [],
    };
  }
}

export { getArgs };
