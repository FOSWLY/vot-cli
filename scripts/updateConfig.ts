import path from "node:path";
import VOTConfig from "@vot.js/shared/config";

import { version, name } from "../package.json";
import config from "../src/config.ts";

const rootPath = path.join(__dirname, "..");
const CONFIG_PATH = "/src/config.ts";
const CONFIG_ABS_PATH = path.join(__dirname, "..", CONFIG_PATH);

const scriptPath = path.relative(rootPath, import.meta.filename);

async function rewriteConfig(data: typeof config) {
  await Bun.write(
    CONFIG_ABS_PATH,
    `// This file is auto-generated.
    // All comments are deleted when building ${name}.
    // Write comments in ${scriptPath}
    import { ConfigSchema } from "./types/config";

    export default ${JSON.stringify(data, null, 2)} as ConfigSchema`,
  );

  // prettify updated config
  const proc = Bun.spawn([
    "bunx",
    "pretty-quick",
    "--pattern",
    `".${CONFIG_PATH}"`,
  ]);
  await new Response(proc.stdout).text();
  proc.kill();

  console.info("✅ Successfully rewrited config");
}

config.version = version;
config.defaultVotHost = VOTConfig.hostVOT;
await rewriteConfig(config);
