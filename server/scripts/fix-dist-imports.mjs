import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/generated/prisma/", import.meta.url));

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.name.endsWith(".js")) files.push(path);
  }
  return files;
}

const files = await walk(root);
for (const file of files) {
  const source = await readFile(file, "utf8");
  const next = source.replace(
    /(\bfrom\s+)(["'])(\.\.?\/[^"']+)\2/g,
    (match, prefix, quote, spec) => {
      if (spec.endsWith(".js")) return match;
      return `${prefix}${quote}${spec}.js${quote}`;
    },
  );
  if (next !== source) await writeFile(file, next);
}
