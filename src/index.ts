import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

import { getArgs } from "./args";
import { executeVOT } from "./client";
import { sendCLIVersion, sendHelpMessage } from "./resources/messages";

async function main() {
  const { values, positionals } = getArgs();
  if (values.version) {
    return sendCLIVersion();
  }

  if (values.help || positionals.length === 0) {
    return sendHelpMessage();
  }

  if (values.outdir && !values.preview) {
    const outdirPath = path.join(process.cwd(), values.outdir);
    if (!fsSync.existsSync(outdirPath)) {
      try {
        await fs.mkdir(outdirPath);
      } catch {
        throw new Error(`Invalid outdir: ${outdirPath.toString()}`);
      }
    }
  }

  return await executeVOT({ values, positionals });
}

try {
  await main();
} catch (err) {
  console.error((err as Error).message);
}
