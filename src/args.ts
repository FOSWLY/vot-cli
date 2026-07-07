import { parseArgs } from "node:util";

import type { ArgsInfo } from "./types/args";
import { schema } from "./resources/schema";

function getArgs(): ArgsInfo {
  const args: ArgsInfo = parseArgs({
    options: schema,
    strict: true,
    allowPositionals: true,
  });
  const { positionals } = args;

  const values = Object.fromEntries(
    Object.entries(args.values).map(([key, val]) => {
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
}

export { getArgs };
