import { execFileSync, spawnSync } from "node:child_process";
import { statSync } from "node:fs";

const dir = process.argv[2];
const branch = process.argv[3];
const limit = Number(process.argv[4] || 40) * 1024 * 1024;
const message = process.argv[5] || "crawl";
const MAX_FILES = 1500;

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28 });
const run = (...args) => spawnSync("git", args, { stdio: "inherit" }).status === 0;
const list = (...args) => git(...args).split("\0").filter(Boolean);

function stage(paths) {
  const result = spawnSync("git", ["add", "-A", "--pathspec-from-file=-", "--pathspec-file-nul"], { input: paths.join("\0"), stdio: ["pipe", "inherit", "inherit"] });
  if (result.status !== 0) throw new Error("git add failed");
}

function push() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (run("push", "origin", "HEAD:" + branch)) return true;
    console.log(`push failed, attempt ${attempt}`);
    spawnSync("sleep", [String(attempt * 5)]);
    run("pull", "--rebase", "origin", branch);
  }
  return false;
}

function commitAndPush(paths, label) {
  stage(paths);
  if (!git("diff", "--cached", "--name-only").trim()) return true;
  if (!run("commit", "-q", "-m", `${message} (${label})`)) throw new Error("git commit failed");
  return push();
}

const deleted = list("ls-files", "-z", "-d", "--", dir);
const gone = new Set(deleted);
const changed = [...new Set([...list("ls-files", "-z", "-o", "--exclude-standard", "--", dir), ...list("ls-files", "-z", "-m", "--", dir)])].filter((path) => !gone.has(path));

if (!deleted.length && !changed.length) {
  console.log("nothing to commit");
  process.exit(0);
}

let ok = true;
if (deleted.length) ok = commitAndPush(deleted, "removed files") && ok;

const sized = changed.map((path) => ({ path, size: statSync(path).size })).sort((a, b) => a.path.localeCompare(b.path));
const batches = [];
let current = [], bytes = 0;
for (const file of sized) {
  if (current.length && (bytes + file.size > limit || current.length >= MAX_FILES)) {
    batches.push(current);
    current = [];
    bytes = 0;
  }
  current.push(file.path);
  bytes += file.size;
}
if (current.length) batches.push(current);

console.log(`${changed.length} files in ${batches.length} batches`);
for (let i = 0; i < batches.length; i++) {
  const pushed = commitAndPush(batches[i], `part ${i + 1}/${batches.length}`);
  console.log(`batch ${i + 1}/${batches.length}: ${pushed ? "pushed" : "FAILED"}`);
  if (!pushed) {
    ok = false;
    break;
  }
}
process.exit(ok ? 0 : 1);
