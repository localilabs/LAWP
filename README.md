<p align="center"><img src="https://api.actuent.ai/assets/lawpy/lawpy-dance.gif" width="108" height="72" alt="Lawpy, the Actuent mascot, dancing"></p>

# LAWP — Locali AI Web Protocol

LAWP is an open protocol for representing websites in a structured format that AI agents can read, understand, and act on.

The web was built for humans. HTML is designed to be rendered visually in a browser. AI agents trying to browse the web get back raw HTML — a wall of tags, scripts, and noise they can't make sense of.

LAWP fixes that. It's a clean, structured JSON representation of a website — every page, all the content, every available action — structured in a way AI can actually reason about.

## The problem LAWP solves

When an AI agent visits a website today:
- It gets back raw HTML with thousands of irrelevant tags
- It can't reliably extract meaning, prices, availability, or actions
- It has no standard way to know what it can DO on a site
- Every site requires custom scraping logic

LAWP gives every website a machine-readable layer that AI agents can use natively.

## LAWP format

```json
{
  "domain": "abdisbarber.com",
  "name": "Abdi's Barber",
  "pages": {
    "/": {
      "title": "Abdi's Barber — Amsterdam",
      "content": "Premier barbershop in the heart of Amsterdam. Walk-ins welcome."
    },
    "/services": {
      "title": "Services",
      "content": "Haircut 25€. Beard trim 15€. Full groom 35€."
    },
    "/about": {
      "title": "About",
      "content": "Family run since 2012. Specialists in fades and traditional cuts."
    }
  },
  "actions": [
    {
      "id": "book",
      "name": "Book appointment",
      "description": "Book a haircut at Abdi's Barber",
      "intent": ["book", "appointment", "haircut", "barber", "fade", "trim"],
      "input": {
        "type": "text",
        "required": false
      }
    }
  ]
}
```

## Fields

### Root
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| domain | string | Yes | The site's domain (e.g. `nike.com`) |
| name | string | Yes | Human-readable site name |
| pages | object | Yes | Map of URL paths to page objects |
| actions | array | Yes | List of available actions on the site |

### Page object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Page title |
| content | string | Yes | Plain English summary of page content |

### Action object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique action identifier |
| name | string | Yes | Human-readable action name |
| description | string | Yes | What this action does |
| intent | string[] | Yes | Keywords that trigger this action |
| input | object | Yes | Input type and whether it's required |

### Input types
- `text` — accepts a text string
- `number` — accepts a number
- `none` — no input required
- `object` — named fields like `date`, `time` and `email` (v0.3; see [Structured inputs](LAWP.md#structured-inputs-v03))

## Command-line tool

```bash
npx @actuent/lawp check yoursite.com          # find your LAWP (well-known, link, header or robots.txt) and validate it
npx @actuent/lawp validate lawp.json          # validate a local file against the schema and rules
npx @actuent/lawp init yoursite.com > lawp.json   # write a starter file
npx @actuent/lawp test yoursite.com book      # send a signed test request to an action endpoint
```

## What's new in 0.5

- **Standard action types**: `book_table`, `book_appointment`, `check_availability`, `request_quote`, `contact`, `order`, `search` and `subscribe`, each with the fields it takes, so every agent knows what an action does and what to ask the user. See [Standard action types](LAWP.md#standard-action-types-v05).

## What's new in 0.4

- **Discovery** by `<link rel="lawp">`, a `Link` header or robots.txt, for platforms that can't host `/.well-known/` files
- **Business details, hours and offers** in the document itself
- **Safety labels** (`requires_confirmation`, `costs_money`, `reversible`, `destructive`)
- **Results and standard errors**, **quotes** before committing, and **long-running actions**
- **User accounts** with OAuth 2.1 for actions on the user's own account
- **Translations** and **split files** for multilingual and large sites
- **HTTP Message Signatures** (RFC 9421, as in Web Bot Auth) so sites verify any agent the same way
- A **JSON Schema** ([`schema/lawp.schema.json`](schema/lawp.schema.json)) and **conformance tests** (`npm test`)

Full details: [LAWP.md](LAWP.md).

## Design principles

**Plain English content** — AI reads content like a human, not a parser. No HTML, no markdown, just clear prose.

**Intent-based actions** — AI matches user intent to available actions naturally using the intent array.

**Page-level structure** — AI can navigate a site the way a human browses it, going deeper into specific pages.

**No HTML** — Zero noise. Only the information that matters.

## Using LAWP

### Search for a site's LAWP

```bash
curl -X POST https://api.actuent.ai/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"barber amsterdam"}'
```

### Connect via MCP

Add Actuent as an MCP tool in Claude or any MCP-compatible AI:

```json
{
  "mcpServers": {
    "actuent": {
      "url": "https://agents.actuent.ai/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### Add your site to LAWP

```bash
npm install @actuent/sdk
```

```typescript
import { register } from "@actuent/sdk"

await register({
  apiKey: "your-actuent-api-key",
  site: {
    domain: "yoursite.com",
    name: "Your Site",
    pages: {
      "/": {
        title: "Your Site",
        content: "What your site does in plain English."
      }
    },
    actions: []
  }
})
```

## `.well-known/lawp.json`

Sites that natively support LAWP can serve their LAWP at `/.well-known/lawp.json`. AI agents and crawlers check this endpoint first before falling back to Actuent's crawler.

## Implementations

- **[Actuent](https://actuent.ai)** — The Internet for AI. Search engine and MCP server for AI agents built on LAWP.
- **[@actuent/sdk](https://npmjs.com/package/@actuent/sdk)** — npm package to list your site on Actuent.

## License

MIT — LAWP is an open protocol. Anyone can implement it.

## Action endpoints (v0.2)

Sites can make their actions executable by AI agents by adding an `endpoint` to each action in their own `/.well-known/lawp.json`. See [LAWP.md → Action endpoints](LAWP.md#action-endpoints).

## GitHub Action

Check your `lawp.json` on every push. Lawpy reports back in the job summary: he dances when it's valid.

```yaml
# .github/workflows/lawp.yml
name: LAWP
on: [push, pull_request]
jobs:
  lawp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: localilabs/lawp@main
        with:
          path: .well-known/lawp.json   # where your file is
          # domain: yoursite.com        # optional: also check the live site
```
