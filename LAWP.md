# LAWP — Locali AI Web Protocol

**Version:** 0.4.0
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
| `lawp_version` | `string` | — | The LAWP version the document follows, e.g. `"0.4"` |
| `language` | `string` | — | ISO 639-1 code of the language the text is written in. Defaults to `"en"` |
| `updated_at` | `string` | — | When the document last changed (ISO 8601) |
| `ttl` | `integer` | — | Seconds agents may cache the document. Defaults to 3600; between 300 and 604800 |
| `business` | `object` | — | Address, hours, contact details and prices for a business ([Business](#business-v04)) |
| `accounts` | `object` | — | How agents connect a user's account, for actions that need one ([User accounts](#user-accounts-v04)) |
| `translations` | `object` | — | The same content in other languages ([Languages and large sites](#languages-and-large-sites-v04)) |
| `more_pages` | `string[]` | — | URLs of extra page files, for sites with many pages ([Languages and large sites](#languages-and-large-sites-v04)) |

A JSON Schema for LAWP documents is at [`schema/lawp.schema.json`](schema/lawp.schema.json), with conformance examples in [`tests/`](tests/).

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
| `output` | `object` | — | What a successful response contains: `{ "fields": [Field] }` ([Results and errors](#results-and-errors-v04)) |
| `modes` | `string[]` | — | `["execute", "quote"]` when the endpoint can return a quote first ([Quotes and availability](#quotes-and-availability-v04)) |
| `safety` | `object` | — | Whether agents must ask the user first, and why ([Safety](#safety-v04)) |
| `account` | `"none" \| "optional" \| "required"` | — | Whether the action needs the user's own account ([User accounts](#user-accounts-v04)). Defaults to `"none"` |
| `scopes` | `string[]` | — | Account scopes the action needs |
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

### Business (v0.4)

Businesses can describe themselves directly, instead of relying on agents to find schema.org data in their HTML.

```json
"business": {
  "type": "HairSalon",
  "telephone": "+31 20 123 4567",
  "email": "hello@abdisbarber.com",
  "price_range": "€€",
  "address": { "street": "Westerstraat 1", "postcode": "1015 LV", "city": "Amsterdam", "country": "NL" },
  "geo": { "lat": 52.3791, "lon": 4.8840 },
  "opening_hours": [
    { "days": ["Tu", "We", "Th", "Fr"], "opens": "09:00", "closes": "18:00" },
    { "days": ["Sa"], "opens": "09:00", "closes": "16:00" }
  ],
  "closed_on_public_holidays": true,
  "offers": [
    { "name": "Skin fade", "price": 25, "currency": "EUR", "category": "Cuts", "action": "book" },
    { "name": "Beard trim", "price": 15, "currency": "EUR", "category": "Beard", "action": "book" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | A [schema.org](https://schema.org/LocalBusiness) business type, e.g. `Restaurant`, `HairSalon`, `Store` |
| `telephone`, `email` | `string` | Contact details |
| `price_range` | `string` | e.g. `"€€"` |
| `address` | `object` | `street`, `postcode`, `city`, `region`, `country` (ISO 3166 code) |
| `geo` | `object` | `lat` and `lon` |
| `opening_hours` | `object[]` | `days` (`Mo`–`Su`), `opens` and `closes` (`HH:MM`, local time; `closes` earlier than `opens` means past midnight) |
| `closed_on_public_holidays` | `boolean` | Closed on the country's public holidays |
| `offers` | `object[]` | Services, menu items or products: `name`, `price`, `currency`, `category`, `description`, and `action` (the id of the action that books or buys it) |

### Safety (v0.4)

Tells agents when they must ask the user before running an action, and why.

```json
"safety": { "requires_confirmation": true, "costs_money": { "amount": 25, "currency": "EUR" }, "reversible": true, "destructive": false }
```

| Field | Type | Description |
|-------|------|-------------|
| `requires_confirmation` | `boolean` | The agent must get the user's explicit OK before executing |
| `costs_money` | `boolean \| object` | The action charges the user; optionally the `amount` and `currency` |
| `reversible` | `boolean` | It can be undone (e.g. a booking can be cancelled) |
| `destructive` | `boolean` | It deletes or changes something that can't be restored |

Agents **must** ask the user before executing an action that has `requires_confirmation`, `costs_money` or `destructive` set, or that has no `safety` object at all. Sites should still treat every request as untrusted.

### Results and errors (v0.4)

`output.fields` describes a successful response, in the same field format as [structured inputs](#structured-inputs-v03), so agents know what to expect and what to tell the user:

```json
"output": { "fields": [
  { "name": "confirmation", "type": "string", "description": "Booking reference" },
  { "name": "starts_at", "type": "datetime" }
] }
```

Errors use one format, so agents can react without reading prose. Return a 4xx or 5xx status with:

```json
{ "error": { "code": "unavailable", "message": "That time is taken. 14:30 and 15:00 are free.", "field": "time" } }
```

| Code | Status | Meaning |
|------|--------|---------|
| `invalid_input` | 400 | A field is wrong; `field` says which |
| `missing_input` | 400 | A required field is missing |
| `unavailable` | 409 | Not possible at that time or in that amount (sold out, fully booked) |
| `not_found` | 404 | The thing the input refers to doesn't exist |
| `needs_confirmation` | 428 | The request needs the user's confirmation first |
| `needs_account` | 401 | The action needs the user's account ([User accounts](#user-accounts-v04)) |
| `invalid_signature` | 401 | The request isn't signed, or the signature doesn't verify |
| `payment_required` | 402 | Payment is needed to continue |
| `rate_limited` | 429 | Too many requests; send `Retry-After` |
| `internal` | 500 | Something went wrong on the site |

`{ "error": "message" }` (a plain string, as in 0.2) is still accepted.

### Quotes and availability (v0.4)

An action with `"modes": ["execute", "quote"]` can answer "what would this cost, and is it available?" without doing anything. The agent sends `"mode": "quote"` in the request (and the `X-LAWP-Mode: quote` header). The site responds with:

```json
{
  "quote": { "available": true, "price": 25, "currency": "EUR", "expires_at": "2026-10-03T12:00:00Z" },
  "options": [ { "time": "14:00" }, { "time": "14:30" }, { "time": "16:00" } ]
}
```

`options` lists alternatives the user can choose from, as partial inputs the agent can send back with `"mode": "execute"`. Quotes are free and never change anything. Without a `mode`, a request means `execute`.

### Long-running actions (v0.4)

When an action can't finish within 10 seconds (for example a restaurant confirms bookings by hand), the site responds `202 Accepted`:

```json
{ "status": "pending", "status_url": "https://abdisbarber.com/api/lawp/status/AB-1234", "retry_after_seconds": 60 }
```

The agent checks `status_url` with a signed `GET` (not more often than `retry_after_seconds`), which returns `{ "status": "pending" }`, `{ "status": "completed", "result": { … } }` or `{ "status": "failed", "error": { … } }`. `status_url` must be `https://` on the site's own domain.

### User accounts (v0.4)

Some actions act on the user's own account: "reorder my last order", "move my booking". The document says how agents connect an account with OAuth 2.1:

```json
"accounts": {
  "type": "oauth2",
  "authorization_url": "https://shop.example/oauth/authorize",
  "token_url": "https://shop.example/oauth/token",
  "registration_url": "https://shop.example/oauth/register",
  "scopes": { "orders:read": "See your orders", "orders:write": "Place orders for you" }
}
```

An action with `"account": "required"` (and the `scopes` it needs) is sent with `Authorization: Bearer <the user's token>` in addition to the agent's request signature. Agents use the authorization code flow with PKCE; `registration_url` supports dynamic client registration (RFC 7591). Without a token the site responds with the `needs_account` error. `"account": "optional"` means the action works as a guest and does more when signed in.

### Languages and large sites (v0.4)

Write the main document in one language (`language`, English recommended) and add others under `translations`, keyed by ISO 639-1 code:

```json
"translations": {
  "nl": {
    "name": "Abdi's Kapper",
    "pages": { "/": { "title": "Abdi's Kapper — Amsterdam", "content": "Kapper in de Jordaan…" } },
    "actions": { "book": { "name": "Afspraak maken", "description": "Maak een afspraak bij Abdi's Kapper", "intent": ["afspraak", "boeken", "knippen"] } }
  }
}
```

Sites with many pages list extra files in `more_pages`. Each is `{ "pages": { … } }`, served as JSON on the site's own domain, without redirects:

```json
"more_pages": ["https://shop.example/.well-known/lawp/pages-1.json", "https://shop.example/.well-known/lawp/pages-2.json"]
```

Keep each file under 1 MB; agents read at most 50. Use `updated_at` and `ttl` so agents know how long to cache.

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

Sites can declare their own LAWP. It is checked before crawling and gives sites full control over their AI-readable representation.

### Discovery (v0.4)

Agents look for a site's LAWP in this order and use the first valid one:

1. `https://<domain>/.well-known/lawp.json`
2. An HTTP `Link` header on the homepage: `Link: <https://…/lawp.json>; rel="lawp"`
3. A link in the homepage's `<head>`: `<link rel="lawp" type="application/json" href="https://…/lawp.json">`
4. A line in `/robots.txt`: `LAWP: https://…/lawp.json`

Options 2–4 are for sites that can't serve files at `/.well-known/` (Shopify, Squarespace, Wix, Webflow and similar): upload the file anywhere, for example to the platform's file storage, and point to it from the homepage. Because the site's own homepage or robots.txt vouches for the file, it may be on another host; its `domain` must still match the site, and action endpoints must still be on the site's own domain. Files are fetched without following redirects.

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
- Endpoints are only trusted in the site's own LAWP ([discovered](#discovery-v04) from its `/.well-known/lawp.json`, homepage or robots.txt), because only the site's owner can publish those. Endpoints in crawled or registered LAWP are ignored.
- `endpoint.url` must be `https://` and on the site's own domain or a subdomain of it.
- Redirects are not followed. Respond within 10 seconds.

**Request** (`POST`, `Content-Type: application/json`)
```json
{ "lawp_version": "0.4", "action": "book", "mode": "execute", "input": { "date": "2026-10-03", "time": "14:00", "service": "Skin fade", "name": "Sam", "email": "sam@example.com" }, "request_id": "5b1c…", "test": false }
```
`input` is a string or number for `text`/`number` actions, an object for `object` actions (validated and normalised: enum values use the site's spelling, times are `HH:MM`), and `null` when there's none.
Headers: `X-LAWP-Action: book`, `X-Actuent-Request-Id: <uuid>`, `User-Agent: Actuent/1.0 (+https://actuent.ai)`.
For `GET` endpoints, `input` is sent as the `?input=` query parameter (JSON for objects), and each field of an object input is also sent as its own query parameter.

**Response**
Return a 2xx status for success and a short JSON body the agent can relay to the user, e.g. `{ "status": "booked", "confirmation": "AB-1234", "time": "Sat 14:00" }` (describe it with [`output`](#results-and-errors-v04)). Return an [error object](#results-and-errors-v04) when the input can't be used, so the agent can ask the user for what's missing. Use `202` for [long-running actions](#long-running-actions-v04).

**Signatures (v0.4: HTTP Message Signatures)**
Agents sign action requests with [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421) (RFC 9421), the same standard as [Web Bot Auth](https://datatracker.ietf.org/wg/webbotauth/about/), so a site can verify any agent the same way:

- `Signature-Agent: "https://agents.example"`: where the agent's keys are published, at `/.well-known/http-message-signatures-directory` (a JWKS of Ed25519 keys)
- `Content-Digest: sha-256=:<base64>:` for requests with a body (RFC 9530)
- `Signature-Input: sig1=("@method" "@target-uri" "content-digest" "signature-agent");created=<unix>;expires=<unix>;keyid="<JWK thumbprint>";alg="ed25519";tag="lawp"` (without `"content-digest"` for `GET`)
- `Signature: sig1=:<base64 signature>:`

Verify: fetch the directory named by `Signature-Agent` (allow-list the agents you trust), pick the key whose RFC 7638 thumbprint equals `keyid`, rebuild the signature base from the listed components, verify the Ed25519 signature, check `Content-Digest` against the raw body, and reject requests past `expires` or created more than 5 minutes ago.

Actuent's directory: `https://agents.actuent.ai/.well-known/http-message-signatures-directory`.

**Signatures (v0.2 scheme, still sent)**
Actuent also signs every action request with its original Ed25519 scheme:
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

LAWP follows semantic versioning. The current version is `0.4.0`.

- `0.4.0` adds discovery by link, header and robots.txt; business details, hours and offers; safety labels; results and standard errors; quotes; long-running actions; user accounts; translations and split files; HTTP Message Signatures; and a JSON Schema with conformance tests.
- `0.3.0` added structured inputs (`input.type: "object"` with `fields`).
- `0.2.0` added action endpoints, signed requests and test mode.
- `0.1.0` was the first version.

Every version is backwards compatible: a `0.1` document is a valid `0.4` document.

Breaking changes will increment the major version. The `version` field may be added to future LAWP documents.

---

## License

MIT. LAWP is an open protocol. Anyone can implement it.

---

## Contributing

Issues and PRs welcome at [github.com/localilabs/lawp](https://github.com/localilabs/lawp). Run the conformance tests with `npm test`.
