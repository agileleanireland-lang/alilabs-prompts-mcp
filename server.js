// Ali Labs Prompt Library — MCP server
// Serves every Markdown file in ./prompts as an MCP prompt over Streamable HTTP,
// plus the discovery files Lighthouse and ARD registries look for.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import matter from "gray-matter";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, "prompts");
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const VERSION = "1.0.0";

// ---- Load prompts -------------------------------------------------------
// Each file: YAML front matter (name, title, description, arguments) + body.
// Use {{argument_name}} in the body; it is filled in when a client asks for the prompt.
function loadPrompts() {
  return fs
    .readdirSync(PROMPTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(PROMPTS_DIR, file), "utf8"));
      return {
        name: data.name || path.basename(file, ".md"),
        title: data.title || data.name,
        description: data.description || "",
        arguments: data.arguments || [],
        body: content.trim(),
      };
    });
}

function fill(body, args) {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    args[key] !== undefined && args[key] !== "" ? args[key] : `[${key}]`
  );
}

function buildServer(prompts) {
  const server = new McpServer({ name: "alilabs-prompt-library", version: VERSION });
  for (const p of prompts) {
    const shape = {};
    for (const a of p.arguments) {
      const field = z.string().describe(a.description || a.name);
      shape[a.name] = a.required ? field : field.optional();
    }
    server.registerPrompt(
      p.name,
      { title: p.title, description: p.description, argsSchema: shape },
      (args = {}) => ({
        description: p.description,
        messages: [{ role: "user", content: { type: "text", text: fill(p.body, args) } }],
      })
    );
  }
  return server;
}

// ---- HTTP ---------------------------------------------------------------
const app = express();
app.use(express.json());

// Stateless Streamable HTTP: a fresh server per request, no sessions to manage.
app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer(loadPrompts());
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

const notAllowed = (_req, res) =>
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
app.get("/mcp", notAllowed);
app.delete("/mcp", notAllowed);

// Discovery files (/.well-known/ard.json and /.well-known/mcp/server-card.json)
app.use("/.well-known", express.static(path.join(PUBLIC_DIR, ".well-known"), { dotfiles: "allow" }));

app.get("/", (_req, res) =>
  res.json({ name: "Ali Labs Prompt Library", mcp: "/mcp", prompts: loadPrompts().map((p) => p.name) })
);

app.listen(PORT, () => console.log(`Prompt library MCP server on http://localhost:${PORT}/mcp`));
