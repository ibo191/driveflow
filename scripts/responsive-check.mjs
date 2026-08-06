import assert from "node:assert/strict";
import { createReadStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const playwrightPath =
  "/Users/ibi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs";
const { chromium } = await import(playwrightPath);
const port = 4193;
const root = process.cwd();
const screenshotDir = join(root, "tmp", "screenshots");
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

await mkdir(screenshotDir, { recursive: true });

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
const widths = [320, 375, 768, 1024, 1440];

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto(`http://127.0.0.1:${port}`);
    await page.locator("button", { hasText: "Find my course" }).click();
    await page.locator("label[for='confidence-very-confident']").click();
    await page.locator("button", { hasText: "Next" }).click();
    await page.locator("label", { hasText: "school, work" }).click();
    await page.locator("button", { hasText: "Next" }).click();
    await page.locator("label", { hasText: "more practice" }).click();
    await page.locator("button", { hasText: "Next" }).click();
    await page.locator("label", { hasText: "properly prepared" }).click();
    await page.locator("button", { hasText: "See result" }).click();

    await page.locator("h2", { hasText: "Flexible" }).waitFor();
    const overflowReport = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const offenders = [...document.querySelectorAll("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            className: element.className,
            tagName: element.tagName,
            width: rect.width,
            right: rect.right,
            text: element.textContent?.trim().slice(0, 80)
          };
        })
        .filter((item) => item.right > viewportWidth + 1)
        .sort((a, b) => b.right - a.right)
        .slice(0, 5);
      return {
        hasOverflow: document.documentElement.scrollWidth > viewportWidth,
        offenders
      };
    });
    assert.equal(
      overflowReport.hasOverflow,
      false,
      `horizontal overflow at ${width}px: ${JSON.stringify(overflowReport.offenders)}`
    );
    assert.deepEqual(consoleErrors, [], `console errors at ${width}px`);

    await page.screenshot({
      fullPage: true,
      path: join(screenshotDir, `course-finder-${width}.png`)
    });
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`Responsive checks passed. Screenshots saved to ${screenshotDir}`);
