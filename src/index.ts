#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

import { getArgs } from "./args";
import { executeVOT } from "./client";
import { sendCLIVersion, sendHelpMessage } from "./resources/messages";

async function ensureOutputDir(outDir: string) {
  try {
    const stats = await fs.stat(outDir);
    if (!stats.isDirectory()) {
      throw new Error(`Invalid outdir: ${outDir}`);
    }
  } catch (err) {
    const error = err as Error & { code?: string };
    if (error.code !== "ENOENT") {
      throw error;
    }

    await fs.mkdir(outDir, { recursive: true });
  }
}

async function main() {
  const { values, positionals } = getArgs();
  if (values.version) {
    return sendCLIVersion(values.json);
  }

  if (values.help || positionals.length === 0) {
    return sendHelpMessage(values.json);
  }

  const outDirName = values.out ?? values.outdir;
  if (outDirName && !values.preview) {
    await ensureOutputDir(path.resolve(outDirName));
  }

  return await executeVOT({ values, positionals });
}

try {
  await main();
} catch (err) {
  console.error((err as Error).message);
  process.exitCode = 1;
}
