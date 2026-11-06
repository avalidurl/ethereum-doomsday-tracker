#!/usr/bin/env node
/** Assert Vite dist keys match publicPathToDistKey under /ethereum-doomsday. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
if (!existsSync(dist)) {
  console.error("dist/ missing — run npm run build first");
  process.exit(1);
}

const PREFIX = "/ethereum-doomsday";

function publicPathToDistKey(pathname) {
  if (!(pathname === `${PREFIX}/` || pathname.startsWith(`${PREFIX}/`))) return null;
  let rest = pathname.slice(PREFIX.length);
  if (rest === "" || rest === "/") return "index.html";
  if (rest.startsWith("/")) rest = rest.slice(1);
  return rest;
}

function walk(dir, base = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, rel));
    else out.push(rel);
  }
  return out;
}

const files = walk(dist);
const html = readFileSync(path.join(dist, "index.html"), "utf8");
const assetRefs = [...html.matchAll(/\/ethereum-doomsday\/(assets\/[^"'\s]+)/g)].map((m) => m[1]);
if (assetRefs.length < 1) {
  console.error("index.html has no /ethereum-doomsday/assets/ refs — Vite base misconfigured");
  process.exit(1);
}

let ok = 0;
for (const ref of assetRefs) {
  const key = publicPathToDistKey(`${PREFIX}/${ref}`);
  if (key !== ref || !files.includes(ref)) {
    console.error("Asset map miss:", ref, "→", key, "exists=", files.includes(ref));
    process.exit(1);
  }
  ok++;
}

const indexKey = publicPathToDistKey(`${PREFIX}/`);
if (indexKey !== "index.html" || !files.includes("index.html")) {
  console.error("index map failed");
  process.exit(1);
}

console.log(`dist prefix map OK: ${ok} html asset refs + index.html among ${files.length} files`);
