import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

const root = resolve(process.cwd(), "dist");
const port = Number(process.env.AIVIC_TEST_SERVER_PORT || 4173);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const tables = new Map();
const externalStubs = [];

const loadSeed =() => {
  tables.clear();
  for (const candidate of [join(root, "api", "data.json"), resolve(process.cwd(), "api", "data.json")]) {
    if (!existsSync(candidate)) continue;
    const parsed = JSON.parse(readFileSync(candidate, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
    for (const [tableName, rows] of Object.entries(parsed)) {
      if (!Array.isArray(rows)) continue;
      tables.set(tableName, rows.map((row) => ({ ...row, id: String(row && row.id ? row.id : randomUUID()) })));
    }
    return;
  }
};

const rowsOf = (key) => {
  if (!tables.has(key)) tables.set(key, []);
  return tables.get(key);
};

const sendJson = (response, status, body) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(body === null ? "" : JSON.stringify(body));
};

const readBody = (request) =>
  new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    request.on("error", rejectBody);
  });

const handleData = async (request, response, url, match) => {
  const key = String(url.searchParams.get("table") || "").trim() || "#" + match[1];
  const id = decodeURIComponent(match[2] || "");
  const rows = rowsOf(key);
  const method = String(request.method || "GET").toUpperCase();
  if (method === "GET" && !id) return sendJson(response, 200, rows);
  if (method === "GET") {
    const found = rows.find((row) => row.id === id);
    return found ? sendJson(response, 200, found) : sendJson(response, 404, { error: "Not found" });
  }
  if (method === "POST") {
    const item = JSON.parse((await readBody(request)) || "{}");
    const now = new Date().toISOString();
    const created = { ...item, id: String(item.id || randomUUID()), createdAt: item.createdAt || now, updatedAt: now };
    const index = rows.findIndex((row) => row.id === created.id);
    if (index >= 0) rows[index] = created;
    else rows.push(created);
    return sendJson(response, 201, created);
  }
  if (method === "PUT" && id) {
    const changes = JSON.parse((await readBody(request)) || "{}");
    const index = rows.findIndex((row) => row.id === id);
    const merged = { ...(index >= 0 ? rows[index] : {}), ...changes, id, updatedAt: new Date().toISOString() };
    if (index >= 0) rows[index] = merged;
    else rows.push(merged);
    return sendJson(response, 200, merged);
  }
  if (method === "DELETE" && id) {
    const index = rows.findIndex((row) => row.id === id);
    if (index >= 0) rows.splice(index, 1);
    return sendJson(response, 200, { deleted: true });
  }
  return sendJson(response, 405, { error: "Method not allowed" });
};

const servePage = (response, file, origin) => {
  const extension = extname(file).toLowerCase();
  if (extension !== ".html") {
    response.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(readFileSync(file));
    return;
  }
  const marker = "<script>window.AIVIC_TEST_MODE = true;</script>";
  const html = readFileSync(file, "utf8")
    .replace(/window\.AIVIC_API_URL\s*=\s*"(?:[^"\\]|\\.)*"/g, "window.AIVIC_API_URL = " + JSON.stringify(origin))
    .replace(/window\.AIVIC_GATEWAY_URL\s*=\s*"(?:[^"\\]|\\.)*"/g, "window.AIVIC_GATEWAY_URL = " + JSON.stringify(origin));
  const headIndex = html.search(/<head[^>]*>/i);
  const insertAt = headIndex >= 0 ? headIndex + html.slice(headIndex).indexOf(">") + 1 : 0;
  response.writeHead(200, { "Content-Type": contentTypes[".html"], "Cache-Control": "no-store" });
  response.end(html.slice(0, insertAt) + marker + html.slice(insertAt));
};

loadSeed();

createServer(async (request, response) => {
  try {
    const origin = "http://" + String(request.headers.host || "127.0.0.1:" + port);
    const url = new URL(String(request.url || "/"), origin);
    if (url.pathname === "/__aivic_test__/health") return sendJson(response, 200, { ok: true });
    if (url.pathname === "/__aivic_test__/reset" && request.method === "POST") {
      loadSeed();
      externalStubs.length = 0;
      return sendJson(response, 200, { reset: true });
    }
    if (url.pathname === "/__aivic_test__/external-stubs" && request.method === "POST") {
      externalStubs.push(JSON.parse((await readBody(request)) || "{}"));
      return sendJson(response, 200, { registered: externalStubs.length });
    }
    if (url.pathname === "/me") return sendJson(response, 200, { email: "test@example.com", isAdmin: true });
    if (url.pathname === "/users") return sendJson(response, 200, { users: [] });
    if (url.pathname === "/connections") return sendJson(response, 200, { connections: [] });
    const externalMatch = url.pathname.match(/^\/ext\/([^/]+)$/);
    if (externalMatch && request.method === "POST") {
      const call = JSON.parse((await readBody(request)) || "{}");
      const connectionId = decodeURIComponent(externalMatch[1]);
      const method = String(call.method || "GET").toUpperCase();
      const stub = externalStubs.slice().reverse().find((entry) =>
        entry.connectionId === connectionId &&
        (!entry.method || String(entry.method).toUpperCase() === method) &&
        (!entry.path || String(call.path || "").startsWith(String(entry.path))));
      if (!stub) {
        return sendJson(response, 200, {
          status: 501,
          contentType: "application/json",
          body: JSON.stringify({ error: "外部サービスの模擬の応答が登録されていません。" }),
        });
      }
      return sendJson(response, 200, {
        status: Number(stub.status || 200),
        contentType: String(stub.contentType || "application/json"),
        body: typeof stub.body === "string" ? stub.body : JSON.stringify(stub.body === undefined ? {} : stub.body),
      });
    }
    const dataMatch = url.pathname.match(/^\/api\/(\d+|by-name)(?:\/([^/]+))?\/?$/);
    if (dataMatch) return await handleData(request, response, url, dataMatch);
    let file = resolve(root, "." + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) return sendJson(response, 403, { error: "Forbidden" });
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return sendJson(response, 404, { error: "Not found" });
    return servePage(response, file, origin);
  } catch (error) {
    return sendJson(response, 500, { error: String(error && error.message ? error.message : error) });
  }
}).listen(port, "127.0.0.1", () => {
  console.log("[aivic-test-server] http://127.0.0.1:" + port + " (dist: " + root + ")");
});
