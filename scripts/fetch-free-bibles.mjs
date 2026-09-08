#!/usr/bin/env node
/**
 * @deprecated Prefer `npm run fetch:bible-library` for the full canon.
 * Kept as a thin wrapper for BSB/BBE/NHEB-only refreshes.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const child = spawn(process.execPath, [path.join(__dirname, "fetch-bible-library.mjs")], {
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 1));
