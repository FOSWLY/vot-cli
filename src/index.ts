#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { getArgs, isJsonRequested } from "./args";
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

  const result = await executeVOT({ values, positionals });
  if (result.mode === "visual") {
    if (result.failed) process.exitCode = 1;
    return;
  }

  const output = values.json
    ? JSON.stringify({
        ok: !result.failed,
        summary: {
          total: result.results.length,
          success: result.results.filter(({ status }) => status === "success")
            .length,
          failed: result.results.filter(({ status }) => status === "failed")
            .length,
        },
        results: result.results,
      })
    : result.results.map(({ url }) => url ?? "FAILED").join("\n");
  process[result.hasSuccess ? "stdout" : "stderr"].write(`${output}\n`);
  if (result.failed) process.exitCode = 1;
}

try {
  await main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  if (isJsonRequested()) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: message })}\n`);
  } else {
    console.error(message);
  }
  process.exitCode = 1;
}
