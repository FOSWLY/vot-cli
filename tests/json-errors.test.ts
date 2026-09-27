import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, mock, test } from "bun:test";

import { isJsonRequested } from "../src/args";

const cliPath = fileURLToPath(new URL("../src/index.ts", import.meta.url));

function runCLI(args: string[]) {
  const result = Bun.spawnSync([process.execPath, cliPath, ...args]);
  return {
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout),
    stderr: new TextDecoder().decode(result.stderr),
  };
}

test("unknown arguments return JSON errors regardless of option order", () => {
  for (const args of [
    ["--json", "--unknown"],
    ["--unknown", "--json"],
  ]) {
    const result = runCLI(args);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      ok: false,
      error: expect.stringContaining("Unknown option"),
    });
  }
});

test("invalid URLs include the processing error", () => {
  const result = runCLI(["--json", "not a valid URL"]);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe("");
  expect(JSON.parse(result.stderr)).toMatchObject({
    ok: false,
    results: [{ status: "failed", videoId: null, error: "Invalid URL" }],
  });
});

test("output directory setup errors use the top-level JSON shape", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vot-cli-json-"));
  const file = path.join(dir, "not-a-directory");
  await fs.writeFile(file, "");
  try {
    const result = runCLI([
      "--json",
      `--outdir=${file}`,
      "https://example.com",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      ok: false,
      error: expect.stringContaining("Invalid outdir"),
    });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("no-visual retains FAILED lines instead of JSON error details", () => {
  const result = runCLI(["--no-visual", "not a valid URL"]);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toBe("");
  expect(result.stderr).toBe("FAILED\n");
});

test("JSON detection ignores terminator positionals and string option values", () => {
  expect(isJsonRequested(["--", "--json"])).toBe(false);
  expect(isJsonRequested(["--lang", "--json"])).toBe(false);
  expect(isJsonRequested(["--lang=--json"])).toBe(false);
  expect(isJsonRequested(["--unknown", "--json"])).toBe(true);
});

test("JSON is not inferred from a string option value", () => {
  const result = runCLI(["--lang", "--json"]);
  expect(result.exitCode).toBe(1);
  expect(result.stderr.startsWith("{")).toBe(false);
});

mock.module("@vot.js/node", () => ({
  default: class {
    provider = {};
    translateVideo = async () => ({
      translated: true,
      remainingTime: 0,
      url: "https://example.test/audio.mp3",
    });
  },
}));
mock.module("@vot.js/node/utils/videoData", () => ({
  getVideoData: async (input: string) => {
    if (input === "invalid-input") throw new Error("Mock invalid URL");
    return { videoId: "mock-video" };
  },
}));
mock.module("@vot.js/node/utils/fetchAgent", () => ({
  VOTAgent: Object,
  VOTProxyAgent: Object,
}));
mock.module("@vot.js/core/providers/votworker", () => ({
  VOTNextWorkerProvider: {},
}));
mock.module("@vot.js/core/providers/yandex", () => ({ YandexProvider: {} }));
mock.module("yt-dlp-wrap-plus", () => ({
  default: class {
    getVersion = async () => "mock-version";
  },
}));

test("mixed JSON batches are written to stdout while exiting unsuccessfully", async () => {
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  let stdout = "";
  let stderr = "";
  process.argv = [
    process.execPath,
    cliPath,
    "--json",
    "--preview",
    "valid-input",
    "invalid-input",
  ];
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += chunk.toString();
    return true;
  }) as typeof process.stderr.write;

  try {
    await import("../src/index");
    expect(process.exitCode).toBe(1);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      summary: { total: 2, success: 1, failed: 1 },
      results: [
        { status: "success" },
        { status: "failed", error: "Mock invalid URL" },
      ],
    });
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
});

test("mixed batches retain success and failure details", async () => {
  const { executeVOT } = await import("../src/client");
  const result = await executeVOT({
    values: { json: true, preview: true },
    positionals: ["valid-input", "invalid-input"],
  });

  expect(result).toMatchObject({
    mode: "output",
    hasSuccess: true,
    failed: true,
    results: [
      { status: "success", url: "https://example.test/audio.mp3" },
      { status: "failed", error: "Mock invalid URL" },
    ],
  });
});

test("download-stage errors are not reported as successful translations", async () => {
  const { executeVOT } = await import("../src/client");
  const originalFetch = globalThis.fetch;
  const fetch = mock(() => Promise.reject(new Error("Mock download failure")));
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;

  try {
    const result = await executeVOT({
      values: { json: true, "no-title": true },
      positionals: ["valid-input"],
    });
    expect(result).toMatchObject({
      mode: "output",
      hasSuccess: false,
      failed: true,
      results: [
        {
          status: "failed",
          error: "Failed to download audio, because Mock download failure",
        },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
    mock.restore();
  }
});
