import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const playwrightPath =
  "/Users/ibi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs";
const { chromium } = await import(playwrightPath);
const port = 4183;
const root = process.cwd();
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

const server = createServer((request, response) => {
  const requestPath = new URL(request.url ?? "/", `http://127.0.0.1:${port}`)
    .pathname;
  const safePath = normalize(requestPath)
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]/, "");
  const filePath =
    safePath === "" ? join(root, "index.html") : join(root, safePath);
  const publicPath = join(root, "public", safePath);
  const resolvedPath = existsSync(filePath)
    ? filePath
    : existsSync(publicPath)
      ? publicPath
      : join(root, "index.html");

  response.setHeader(
    "Content-Type",
    types[extname(resolvedPath)] ?? "application/octet-stream"
  );
  createReadStream(resolvedPath).pipe(response);
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const events = [];
page.on("console", (message) => {
  if (message.type() === "error") {
    events.push(message.text());
  }
});

await page.goto(`http://127.0.0.1:${port}`);
await page.locator("button", { hasText: "Find my course" }).click();
await page.locator("label", { hasText: "Fairly confident" }).click();
await page.locator("button", { hasText: "Next" }).click();
await page.locator("label", { hasText: "school, work" }).click();
await page.locator("button", { hasText: "Next" }).click();
await page.locator("label", { hasText: "more practice" }).click();
await page.locator("button", { hasText: "Next" }).click();
await page.locator("label", { hasText: "properly prepared" }).click();
await page.locator("button", { hasText: "See result" }).click();

await page.locator("h2", { hasText: "Flexible" }).waitFor();
const href = await page
  .locator("a", { hasText: "Choose Flexible" })
  .first()
  .getAttribute("href");
assert.equal(href, "/register?course=flexible");
assert.deepEqual(events, []);

await browser.close();
server.close();
console.log("E2E course finder happy path passed.");
