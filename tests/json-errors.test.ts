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

let subtitleResponse = {
  subtitles: [
    {
      translatedLanguage: "en",
      translatedUrl: "https://example.test/subtitle.srt",
    },
  ],
};
const translationRequests: Record<string, unknown>[] = [];
const translationDelays: number[] = [];
let translate = async () => ({
  translated: true,
  remainingTime: 0,
  url: "https://example.test/audio.mp3",
});

mock.module("@vot.js/node", () => ({
  default: class {
    provider = { apiToken: "provider-token" };
    translateVideo = async (request: Record<string, unknown>) => {
      translationRequests.push(request);
      return translate();
    };
    getSubtitles = async () => subtitleResponse;
  },
}));
mock.module("@vot.js/node/utils/videoData", () => ({
  getVideoData: async (input: string) => {
    if (input === "slow-input") {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
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
mock.module("node:timers/promises", () => ({
  setTimeout: async (milliseconds: number) => {
    translationDelays.push(milliseconds);
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
    process.exitCode = originalExitCode ?? 0;
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

test("concurrent output results stay in input order", async () => {
  const { executeVOT } = await import("../src/client");
  const result = await executeVOT({
    values: { json: true, preview: true },
    positionals: ["slow-input", "valid-input"],
  });

  expect(result).toMatchObject({
    results: [{ input: "slow-input" }, { input: "valid-input" }],
  });
});

test("processor reports stages and returns preview results without terminal output", async () => {
  const { createProcessingContext, processUrl } =
    await import("../src/processor");
  const context = await createProcessingContext({ preview: true });
  const events: string[] = [];
  const originalWrite = process.stdout.write;
  const write = mock(() => true);
  process.stdout.write = write as unknown as typeof process.stdout.write;

  try {
    const result = await processUrl("valid-input", context, (event) =>
      events.push(event.type === "stage" ? event.stage : event.type),
    );
    expect(result).toMatchObject({
      input: "valid-input",
      status: "success",
      type: "audio",
      videoId: "mock-video",
      url: "https://example.test/audio.mp3",
    });
    expect(events).toEqual([
      "metadata",
      "videoId",
      "translation",
      "translationFinished",
      "output",
      "finished",
    ]);
    expect(write).not.toHaveBeenCalled();
  } finally {
    process.stdout.write = originalWrite;
  }
});

test("processor returns metadata and subtitle failures with the available video ID", async () => {
  const { createProcessingContext, processUrl } =
    await import("../src/processor");
  const metadataContext = await createProcessingContext({ preview: true });
  expect(await processUrl("invalid-input", metadataContext)).toMatchObject({
    status: "failed",
    videoId: null,
    error: "Mock invalid URL",
  });

  subtitleResponse = { subtitles: [] };
  const subtitleContext = await createProcessingContext({
    preview: true,
    subs: true,
  });
  try {
    expect(await processUrl("valid-input", subtitleContext)).toMatchObject({
      status: "failed",
      videoId: "mock-video",
      error: "No subtitles",
    });
  } finally {
    subtitleResponse = {
      subtitles: [
        {
          translatedLanguage: "en",
          translatedUrl: "https://example.test/subtitle.srt",
        },
      ],
    };
  }
});

test("processor selects the requested subtitle language", async () => {
  const { createProcessingContext, processUrl } =
    await import("../src/processor");
  const context = await createProcessingContext({
    preview: true,
    subs: true,
    reslang: "en",
  });
  expect(await processUrl("valid-input", context)).toMatchObject({
    status: "success",
    type: "subtitles",
    url: "https://example.test/subtitle.srt",
  });
});

test("processor preserves lively voice defaults and checks the client token", async () => {
  const { createProcessingContext, processUrl } =
    await import("../src/processor");
  const calls = [
    {
      values: {
        lang: "en",
        reslang: "ru",
        "lively-voice": true,
        preview: true,
      },
    },
    { values: { lang: "en", reslang: "ru", preview: true } },
    {
      values: {
        lang: "en",
        reslang: "ru",
        "lively-voice": false,
        preview: true,
      },
    },
  ] as const;
  const start = translationRequests.length;
  const results = await Promise.all(
    calls.map(async ({ values }) => {
      const context = await createProcessingContext(values);
      return processUrl("valid-input", context);
    }),
  );

  expect(results.map(({ status }) => status)).toEqual([
    "success",
    "success",
    "success",
  ]);
  const requests = translationRequests.slice(start);
  expect(requests.map(({ requestLang }) => requestLang)).toEqual([
    "en",
    "en",
    "en",
  ]);
  expect(requests.map(({ responseLang }) => responseLang)).toEqual([
    "ru",
    "ru",
    "ru",
  ]);
  expect(
    requests
      .map(
        ({ extraOpts }) =>
          (extraOpts as { useLivelyVoice: boolean }).useLivelyVoice,
      )
      .toSorted(),
  ).toEqual([false, true, true]);
});

test("translation polling waits between pending responses and finishes once", async () => {
  const { createProcessingContext, processUrl } =
    await import("../src/processor");
  const responses = [
    { translated: false, remainingTime: 60, url: "" },
    { translated: false, remainingTime: 30, url: "" },
    {
      translated: true,
      remainingTime: 0,
      url: "https://example.test/done.mp3",
    },
  ];
  const originalTranslate = translate;
  const originalDelaysLength = translationDelays.length;
  const originalRequestsLength = translationRequests.length;
  const events: string[] = [];
  translate = async () => responses.shift()!;

  try {
    const context = await createProcessingContext({ preview: true });
    const result = await processUrl("valid-input", context, (event) =>
      events.push(
        event.type === "translationWaiting"
          ? `waiting:${event.seconds}`
          : event.type,
      ),
    );

    expect(result).toMatchObject({
      status: "success",
      url: "https://example.test/done.mp3",
    });
    expect(events).toEqual([
      "stage",
      "videoId",
      "stage",
      "waiting:60",
      "waiting:30",
      "translationFinished",
      "stage",
      "stage",
    ]);
    expect(translationDelays.slice(originalDelaysLength)).toEqual([
      30_000, 30_000,
    ]);
    expect(translationRequests.slice(originalRequestsLength)).toHaveLength(3);
  } finally {
    translate = originalTranslate;
  }
});

test("translation polling returns a failed result when a later request fails", async () => {
  const { createProcessingContext, processUrl } =
    await import("../src/processor");
  const originalTranslate = translate;
  const originalDelaysLength = translationDelays.length;
  let calls = 0;
  const events: string[] = [];
  translate = async () => {
    if (calls++ === 0) return { translated: false, remainingTime: 30, url: "" };
    throw new Error("Mock later poll failure");
  };

  try {
    const context = await createProcessingContext({ preview: true });
    const result = await processUrl("valid-input", context, (event) =>
      events.push(event.type),
    );

    expect(result).toMatchObject({
      status: "failed",
      videoId: "mock-video",
      error: "Mock later poll failure",
    });
    expect(calls).toBe(2);
    expect(translationDelays.slice(originalDelaysLength)).toEqual([30_000]);
    expect(events).toContain("translationWaiting");
    expect(events).not.toContain("translationFinished");
  } finally {
    translate = originalTranslate;
  }
});

test("processing context reserves unique filenames across URLs", async () => {
  const { createProcessingContext } = await import("../src/processor");
  const outdir = await fs.mkdtemp(path.join(os.tmpdir(), "vot-cli-names-"));
  try {
    const context = await createProcessingContext({ outdir });
    expect(context.reserveFilename("same", "mp3")).toBe("same.mp3");
    expect(context.reserveFilename("same", "mp3")).toBe("same_2.mp3");
  } finally {
    await fs.rm(outdir, { recursive: true, force: true });
  }
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
          videoId: "mock-video",
          error: "Failed to download audio, because Mock download failure",
        },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
    mock.restore();
  }
});
