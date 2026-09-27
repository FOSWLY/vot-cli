import { fileURLToPath } from "node:url";
import { expect, test } from "bun:test";

const cliPath = fileURLToPath(new URL("../src/index.ts", import.meta.url));

test("visual mode exits unsuccessfully when a URL task fails", () => {
  const { exitCode, stdout, stderr } = Bun.spawnSync([
    process.execPath,
    cliPath,
    "not a valid URL",
  ]);

  expect(exitCode).toBe(1);
  expect(
    new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr),
  ).toContain("Invalid URL");
});
