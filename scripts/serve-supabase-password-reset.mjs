import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public-offers");
const routes = new Map([
  ["/", "reset-password.html"],
  ["/redefinir-senha", "reset-password.html"],
  ["/reset-password.html", "reset-password.html"],
  ["/reset-password.css", "reset-password.css"],
  ["/reset-password.js", "reset-password.js"],
  ["/supabase-config.js", "supabase-config.js"],
]);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  const filename = routes.get(pathname);
  if (!filename) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const body = fs.readFileSync(path.join(root, filename));
  response.writeHead(200, {
    "Content-Type": types[path.extname(filename)] || "application/octet-stream",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self'; connect-src https://*.supabase.co wss://*.supabase.co; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") response.end();
  else response.end(body);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error("A porta 3000 já está em uso. Encerre o outro servidor e tente novamente.");
    process.exitCode = 1;
    return;
  }
  throw error;
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Recuperação Supabase disponível em http://localhost:3000");
});
