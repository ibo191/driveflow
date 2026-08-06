import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT ?? 4173);
const root = process.cwd();
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

const server = createServer((request, response) => {
  const requestPath = new URL(request.url ?? "/", `http://localhost:${port}`)
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

server.listen(port, "127.0.0.1", () => {
  console.log(`Driveflow available at http://127.0.0.1:${port}`);
});
