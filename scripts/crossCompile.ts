import { $ } from "bun";

const platforms = [
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-windows-x64",
  "bun-darwin-x64",
  "bun-darwin-arm64",
] as const;

type Platform = (typeof platforms)[number];

async function compile(platform: Platform) {
  await $`bun build --compile --target=${platform} --minify --sourcemap ./src/index.ts --outfile ./build/${platform.replace("bun", "vot")}`;
}

await Promise.all(platforms.map(async (platform) => await compile(platform)));
