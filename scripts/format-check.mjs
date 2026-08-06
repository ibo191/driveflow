import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";

const files = [];

for await (const file of glob("**/*.{js,css,html,json,md}", {
  exclude: ["dist/**", "node_modules/**"]
})) {
  files.push(file);
}

const failures = [];

for (const file of files) {
  const text = await readFile(file, "utf8");
  if (text.includes("\t")) {
    failures.push(`${file}: contains tab characters`);
  }
  if (!text.endsWith("\n")) {
    failures.push(`${file}: missing trailing newline`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Format check passed for ${files.length} files.`);
}
