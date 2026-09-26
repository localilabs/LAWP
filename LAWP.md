# LAWP — Locali AI Web Protocol

**Version:** 0.3.0
**Status:** Active
**Maintained by:** [localilabs](https://localilabs.com)

---

## Overview

LAWP is an open protocol for representing websites in a structured format that AI agents can read, understand, and act on.

The web was built for humans. HTML is designed to be rendered visually in a browser. AI agents trying to browse the web get back raw HTML — a wall of tags, scripts, and noise they can't make sense of. LAWP fixes that.

A LAWP document is a clean, structured JSON representation of a website — every page, all the content, and every available action — structured in a way AI can actually reason about.

---

## Specification

### Root object

```json
{
  "domain": "abdisbarber.com",
  "name": "Abdi's Barber",
  "pages": {},
  "actions": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | `string` | ✅ | The site's domain without protocol (e.g. `nike.com`) |
| `name` | `string` | ✅ | Human-readable site name |
| `pages` | `object` | ✅ | Map of URL paths to page objects |
| `actions` | `array` | ✅ | List of available actions on the site |

---

### Page object

```json
{
  "/services": {
    "title": "Services",
    "content": "Haircut 25€. Beard trim 15€. Full groom 35€."
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ✅ | Page title in plain text |
| `content` | `string` | ✅ | Plain English summary of the page. No HTML. No markdown. Prose only. Max 200 words. |

---

### Action object

```json
{
  "id": "book",
  "name": "Book appointment",
  "description": "Book a haircut at Abdi's Barber",
  "intent": ["book", "appointment", "haircut", "barber"],
  "input": {
    "type": "text",
    "required": false
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier for this action (snake_case) |
| `name` | `string` | ✅ | Human-readable action name |
| `description` | `string` | ✅ | What this action does, in plain English |
| `intent` | `string[]` | ✅ | Keywords that trigger this action. Include synonyms and related terms. Minimum 3. |
| `input.type` | `"text" \| "number" \| "none" \| "object"` | ✅ | Type of input the action accepts. `"object"` means named fields (see [Structured inputs](#structured-inputs-v03)) |
| `input.required` | `boolean` | ✅ | Whether input must be provided to execute the action |
| `input.fields` | `Field[]` | with `"object"` | The named fields the action takes |
| `endpoint.url` | `string` | — | HTTPS URL that performs the action. Only honoured in a site's own `/.well-known/lawp.json` (see [Action endpoints](#action-endpoints)) |
| `endpoint.method` | `"POST" \| "GET"` | — | Defaults to `POST` |
| `url` | `string` | — | Where a person can do this action themselves (e.g. a booking page, which may be on a booking provider). Agents can hand it to the user when the action isn't executable |

### Structured inputs (v0.3)

Free text like "Saturday 2pm, skin fade" works, but the site then has to understand it. With `"type": "object"` an action lists the exact fields it needs, and agents send them as an object:

```json
"input": {
  "type": "object",
  "required": true,
  "fields": [
    { "name": "date", "type": "date", "required": true, "description": "Day of the appointment" },
    { "name": "time", "type": "time", "required": true, "description": "Start time, 24-hour" },
    { "name": "service", "type": "enum", "options": ["Haircut", "Skin fade", "Beard trim"] },
    { "name": "name", "type": "string", "required": true },
    { "name": "email", "type": "email", "required": true }
  ]
}
```

| Field property | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | snake_case, unique within the action |
| `type` | see below | — | Defaults to `"string"` |
| `required` | `boolean` | — | Defaults to `false` |
| `description` | `string` | — | What to ask the user for |
| `options` | `string[]` | with `"enum"` | The allowed values |
| `example` | any | — | An example value |

Field types: `string`, `number`, `integer`, `boolean`, `date` (`2026-10-03`), `time` (`14:00`), `datetime` (ISO 8601 with offset), `email`, `phone`, `url`, `enum`.

Agents should ask the user for any missing required field before executing. Actuent validates the input before calling the endpoint (and returns the problems, so the agent can ask again), and shows each action's input as JSON Schema in `actuent_get_actions`. Endpoints must still validate everything themselves.

At most 30 fields per action.

---

## Full example

```json
{
  "domain": "abdisbarber.com",
  "name": "Abdi's Barber",
  "pages": {
    "/": {
      "title": "Abdi's Barber — Amsterdam",
      "content": "Premier barbershop in the heart of Amsterdam. Walk-ins welcome. Specialists in fades and traditional cuts. Family run since 2012."
    },
    "/services": {
      "title": "Services",
      "content": "Haircut 25€. Beard trim 15€. Full groom 35€. Kids cut 15€."
    },
    "/about": {
      "title": "About",
      "content": "Family run since 2012. Specialists in fades and traditional cuts. Located in the Jordaan district."
    }
  },
  "actions": [
    {
      "id": "book",
      "name": "Book appointment",
      "description": "Book a haircut appointment at Abdi's Barber",
      "intent": ["book", "appointment", "haircut", "barber", "fade", "trim", "amsterdam", "schedule"],
      "input": {
        "type": "text",
        "required": false
      }
    },
    {
      "id": "contact",
      "name": "Contact",
      "description": "Get in touch with Abdi's Barber",
      "intent": ["contact", "call", "email", "message", "reach out"],
      "input": {
        "type": "text",
        "required": true
      }
    }
  ]
}
```

---

## Design principles

### 1. Plain English only
Content must be readable prose. No HTML tags, no markdown formatting, no code, no lists. Write as if explaining the page to a person who can't see it.

### 2. Intent over keywords
The `intent` array is not just keywords — it's the vocabulary an AI might use when a user asks for this action. Think "what would someone say to trigger this?" Include synonyms, related terms, and common misspellings.

### 3. Actions are real
Only include actions the site actually supports. An action implies the site has a mechanism for it. If a site has no booking system, don't include a `book` action.

### 4. Pages are summaries
Page content should summarise the page, not reproduce it. Focus on the most important facts — prices, locations, availability, key offerings. Keep each page under 200 words.

### 5. Domains without protocols
Use `nike.com`, not `https://nike.com`. Protocols are inferred.

---

## Native LAWP support

Sites can declare their own LAWP at `/.well-known/lawp.json`. This is checked before crawling and gives sites full control over their AI-readable representation.
GET https://yourdomain.com/.well-known/lawp.json

Returns a valid LAWP document.

---

## Action endpoints

A site makes its actions **executable** by AI agents by adding an `endpoint` to them in its own `/.well-known/lawp.json`. Agents (for example through Actuent's `actuent_execute_action` tool) then call the endpoint directly instead of sending the user to the website.

```json
{
  "id": "book",
  "name": "Book appointment",
  "description": "Book a haircut at Abdi's Barber",
  "intent": ["book", "appointment", "haircut", "barber"],
  "input": { "type": "text", "required": true },
  "endpoint": { "url": "https://abdisbarber.com/api/lawp/book", "method": "POST" }
}
```

**Rules**
- Endpoints are only trusted when served from the site's own `https://<domain>/.well-known/lawp.json`, because only the site's owner can publish a file there. Endpoints in crawled or registered LAWP are ignored.
- `endpoint.url` must be `https://` and on the site's own domain or a subdomain of it.
- Redirects are not followed. Respond within 10 seconds.

**Request** (`POST`, `Content-Type: application/json`)
```json
{ "lawp_version": "0.3", "action": "book", "input": { "date": "2026-10-03", "time": "14:00", "service": "Skin fade", "name": "Sam", "email": "sam@example.com" }, "request_id": "5b1c…", "test": false }
```
`input` is a string or number for `text`/`number` actions, an object for `object` actions (validated and normalised: enum values use the site's spelling, times are `HH:MM`), and `null` when there's none.
Headers: `X-LAWP-Action: book`, `X-Actuent-Request-Id: <uuid>`, `User-Agent: Actuent/1.0 (+https://actuent.ai)`.
For `GET` endpoints, `input` is sent as the `?input=` query parameter (JSON for objects), and each field of an object input is also sent as its own query parameter.

**Response**
Return a 2xx status for success and a short JSON body the agent can relay to the user, e.g. `{ "status": "booked", "confirmation": "AB-1234", "time": "Sat 14:00" }`. Return a 4xx with `{ "error": "..." }` when the input can't be used, so the agent can ask the user for what's missing.

**Signatures**
Actuent signs every action request with Ed25519:
- Headers: `X-Actuent-Timestamp` (unix seconds), `X-Actuent-Key-Id`, `X-Actuent-Signature: v1=<base64url signature>`
- Signed string: `<timestamp>\n<METHOD>\n<full request URL>\n<sha256 hex of the raw body>` (empty body for `GET`)
- Public keys (JWKS): `https://agents.actuent.ai/.well-known/actuent-signing-keys.json`. Pick the key whose `kid` matches `X-Actuent-Key-Id`.

Verify the signature and reject timestamps more than 5 minutes old before performing an action.

**Test mode**
Requests with `"test": true` in the body (or `?test=true` for `GET`, plus the `X-LAWP-Test: true` header) are test requests, for example from the LAWP Checker on docs.actuent.ai. Validate the input and respond normally, but don't perform the action.

Treat these endpoints like any public API: validate input and rate limit. Agents are expected to confirm with their user before executing.

---

## Using LAWP via Actuent

Actuent is the reference implementation of LAWP — a search engine that indexes the web as LAWP and serves it to AI agents.

**Search:**
```bash
curl -X POST https://api.actuent.ai/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"barber amsterdam"}'
```

**MCP (for AI assistants):**
```json
{
  "mcpServers": {
    "actuent": {
      "url": "https://agents.actuent.ai/api/mcp"
    }
  }
}
```

**Register your site:**
```bash
npm install @actuent/sdk
```

```typescript
import { register } from "@actuent/sdk"
await register({ apiKey: "your-key", site: { /* LAWP object */ } })
```

---

## Versioning

LAWP follows semantic versioning. The current version is `0.3.0`.

- `0.3.0` adds structured inputs (`input.type: "object"` with `fields`).
- `0.2.0` added action endpoints, signed requests and test mode.
- `0.1.0` was the first version.

Every version is backwards compatible: a `0.1` document is a valid `0.3` document.

Breaking changes will increment the major version. The `version` field may be added to future LAWP documents.

---

## License

MIT. LAWP is an open protocol. Anyone can implement it.

---

## Contributing

Issues and PRs welcome at [github.com/localilabs/actuent-public](https://github.com/localilabs/actuent-public).
