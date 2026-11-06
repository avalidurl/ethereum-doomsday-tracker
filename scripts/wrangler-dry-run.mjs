#!/usr/bin/env node
/**
 * Local-only `wrangler deploy --dry-run` helper.
 * Prefers an isolated Node ≥22 binary (Wrangler 4.158 requirement).
 * Never passes Cloudflare credentials; aborts if auth looks required mid-run.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));

function nodeMajor(bin) {
  const r = spawnSync(bin, ["-p", "process.versions.node"], { encoding: "utf8" });
  if (r.status !== 0) return 0;
  return Number(String(r.stdout).trim().split(".")[0] || 0);
}

function resolveNode22() {
  const candidates = [
    process.env.NODE22_BIN,
    path.join(root, "..", ".tools", "node22", "bin", "node"),
    "/workspace/.tools/node22/bin/node",
    process.execPath,
  ].filter(Boolean);
  for (const c of candidates) {
    if (c && existsSync(c) && nodeMajor(c) >= 22) return c;
  }
  return null;
}

const nodeBin = resolveNode22();
if (!nodeBin) {
  console.error(
    "Node ≥22 required for wrangler 4.158 dry-run. Install locally e.g.\n" +
      "  curl -fsSL https://nodejs.org/dist/v22.21.0/node-v22.21.0-linux-x64.tar.xz | tar -xJ -C /workspace/.tools\n" +
      "  mv /workspace/.tools/node-v22.21.0-linux-x64 /workspace/.tools/node22\n" +
      "Or set NODE22_BIN=/path/to/node22",
  );
  process.exit(1);
}

const wranglerPkg = path.dirname(require.resolve("wrangler/package.json"));
const wranglerBin = path.join(wranglerPkg, "bin", "wrangler.js");

const env = { ...process.env };
for (const k of [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_API_KEY",
  "CLOUDFLARE_ACCOUNT_ID",
  "CF_API_TOKEN",
  "CF_ACCOUNT_ID",
]) {
  delete env[k];
}

console.log(`Using Node ${spawnSync(nodeBin, ["-p", "process.versions.node"], { encoding: "utf8" }).stdout.trim()} (${nodeBin})`);
console.log("Running: wrangler deploy --dry-run  (no CF credentials in env)");

const result = spawnSync(nodeBin, [wranglerBin, "deploy", "--dry-run", "--outdir", path.join(root, ".wrangler-dry-run")], {
  cwd: root,
  env,
  encoding: "utf8",
});
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");

const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
const authHints = /log in|wrangler login|Unable to authenticate|401 Unauthorized|need to authenticate|CLOUDFLARE_API_TOKEN/i;
if (authHints.test(combined)) {
  console.error("\nDry-run appears to require Cloudflare authentication. Stopping without bypass.");
  process.exit(2);
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
if (!/dry-run: exiting now/i.test(combined)) {
  console.error("Dry-run finished without the expected local exit marker.");
  process.exit(1);
}
console.log("\nLocal dry-run OK (packaged worker + assets; no upload).");
