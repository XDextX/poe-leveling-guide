// Servidor estático mínimo para probar dist/ en local como la sirve GitHub Pages. Solo escucha en 127.0.0.1.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
  ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml",
};

/** Sirve los archivos de dir en http://127.0.0.1:port; "/" es index.html. Sin caché, para ver siempre el último build. */
export function serve(dir: string, port: number): http.Server {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    const file = path.join(root, url.endsWith("/") ? url + "index.html" : url);
    // Nada fuera de dir, aunque la ruta lleve "..".
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("No encontrado");
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, "127.0.0.1", () => console.log(`Sirviendo ${path.relative(process.cwd(), root) || "."}/ en http://localhost:${port}/`));
  return server;
}
