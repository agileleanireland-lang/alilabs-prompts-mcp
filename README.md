# Ali Labs Prompt Library — MCP server

The ALI Labs prompt builders from alilabs.org, served as MCP prompts so any MCP
client (Claude, Cursor, VS Code and others) can use them directly.

Live at **https://alilabs-prompts-mcp.onrender.com/mcp** (Streamable HTTP).

## Prompts

| Prompt | From | Main choices |
| --- | --- | --- |
| `career-intelligence` | [alilabs.org/career-intelligence](https://alilabs.org/career-intelligence/) | `goal`: jobs, full, apply, evidence, change, ai — plus role, location, experience and more |
| `job-application-helper` | [alilabs.org/ai-job-application-helper](https://alilabs.org/ai-job-application-helper/) | `job_advert` and `cv` (required); `mode`: full, tailor, review, letter, form |
| `job-application-save-progress` | same page | none — asks for a summary to carry into the next chat |
| `small-business-ai-helper` | [alilabs.org/ai-for-small-business-ireland](https://alilabs.org/ai-for-small-business-ireland/) | `business_type` (9 types) × `goal` (7 goals); `version`: full or quick |

Each prompt is built exactly as the web page builds it, from the same templates.

## Files

```
server.js                               the MCP server
tools.js                                the build logic for the four prompts above
data/alilabs-tools.json                 the templates, copied from the alilabs.org pages
prompts/*.md                            optional extra prompts (see below)
public/.well-known/mcp/server-card.json MCP server card
public/.well-known/ard.json             ARD manifest
```

## Keeping it in sync with the website

The templates in `data/alilabs-tools.json` are a copy taken on 7 November 2026.
If you change the wording on one of the pages, update the matching section of that
file (`career`, `job` or `smb`) — or ask Claude to re-extract it — then redeploy.

**Redeploying:** this Render service is linked to the public repo URL, which does
not redeploy automatically. After committing, open the service in Render and click
**Manual Deploy → Deploy latest commit**.

## Adding a simple prompt

Drop a Markdown file into `prompts/`:

```markdown
---
name: my-prompt-name
title: My Prompt Name
description: One sentence on what it does.
arguments:
  - name: topic
    description: What the user fills in
    required: true
---
The prompt text. Use {{topic}} wherever the argument should go.
```

Then add its name to `capabilities` in `public/.well-known/ard.json`.

## Discovery (ARD)

alilabs.org points to `ard.json` with a `<link rel="ard">` tag, added by the
"ARD discovery link (prompt library)" snippet in Code Snippets. After changing
prompts, update `capabilities`, `representativeQueries`, `version` and
`updatedAt` in `ard.json`.

## Run locally

```bash
npm install
npm start            # http://localhost:3000/mcp
```
