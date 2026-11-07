# Ali Labs Prompt Library — MCP server

Serves every Markdown file in `prompts/` as an MCP prompt, so any MCP client
(Claude, Cursor, VS Code, ChatGPT connectors, etc.) can list and use your prompts.
It also serves the discovery files that ARD registries and Lighthouse look for.

```
server.js                               the MCP server (Streamable HTTP at /mcp)
prompts/*.md                            one file per prompt — edit or add these
public/.well-known/mcp/server-card.json MCP server card (what the ARD entry points to)
public/.well-known/ard.json             ARD manifest
```

## 1. Add your prompts

Copy one of the sample files in `prompts/` and edit it:

```markdown
---
name: my-prompt-name          # lowercase-with-dashes, unique
title: My Prompt Name
description: One sentence on what it does — clients show this.
arguments:
  - name: topic
    description: What the user fills in
    required: true
---
The prompt text. Use {{topic}} wherever the argument should go.
```

No restart logic needed — files are read on every request.

The three included prompts (`sprint-retrospective`, `user-story-refiner`,
`ai-delegation-check`) are samples. Delete them once yours are in.

## 2. Run it locally

```bash
npm install
npm start            # http://localhost:3000/mcp
```

Quick check with the MCP Inspector: `npx @modelcontextprotocol/inspector`,
choose "Streamable HTTP", URL `http://localhost:3000/mcp`.

## 3. Deploy it

Any Node 18+ host works (Render, Railway, Fly.io, a VPS). Point a subdomain at it —
the files assume **https://prompts.alilabs.org**. If you use a different address,
change it in both `.well-known` files.

After deploying, these should load:
- https://prompts.alilabs.org/mcp (POST only — a browser GET returns 405, which is correct)
- https://prompts.alilabs.org/.well-known/mcp/server-card.json
- https://prompts.alilabs.org/.well-known/ard.json

## 4. Publish ard.json on alilabs.org (this is what Lighthouse audits)

Lighthouse checks the site you audited, so the manifest also has to be reachable
from **alilabs.org**. alilabs.org runs WordPress, so pick one:

**Option A — upload the file (simplest).** Upload `public/.well-known/ard.json` to
`/.well-known/ard.json` in the WordPress root via your host's file manager or SFTP.
Many hosts already have a `.well-known` folder there (used for SSL certificates).

**Option B — link tag, no file upload.** Add this to the site `<head>` (theme
header, or a plugin like WPCode / Insert Headers and Footers):

```html
<link rel="ard" href="https://prompts.alilabs.org/.well-known/ard.json">
```

Then re-run Lighthouse. Each entry already has 5 `representativeQueries`, which is
what the audit wants for a full score.

## When you add or rename prompts

Update `capabilities` (the prompt names) and, if the library's scope changes,
`representativeQueries` and `description` in `ard.json`. Bump `version` and
`updatedAt` in `ard.json` and `version` in `server-card.json` and `server.js`.
