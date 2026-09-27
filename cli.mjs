#!/usr/bin/env node
// lawp — check, validate and create LAWP files. https://github.com/localilabs/lawp
//   npx @actuent/lawp check yoursite.com          find a site's LAWP (well-known, link, header, robots) and validate it
//   npx @actuent/lawp validate lawp.json          validate a local file against the LAWP 0.4 schema and rules
//   npx @actuent/lawp init yoursite.com           write a starter lawp.json (from what Actuent knows, if anything)
//   npx @actuent/lawp test yoursite.com <action>  send a signed test request to an action endpoint (via Actuent)

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import Ajv from "ajv/dist/2020.js"
import addFormats from "ajv-formats"
import { lawpRules } from "./rules.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const UA = "lawp-cli/0.4 (+https://github.com/localilabs/lawp)"
const color = process.stdout.isTTY && !process.env.NO_COLOR
const c = (code, s) => color ? `\x1b[${code}m${s}\x1b[0m` : s
const ok = s => console.log(`${c(32, "✓")} ${s}`)
const bad = s => console.log(`${c(31, "✗")} ${s}`)
const warn = s => console.log(`${c(33, "!")} ${s}`)
const bare = h => h.toLowerCase().replace(/^www\./, "")

const ajv = new (Ajv.default || Ajv)({ allErrors: true, strict: false })
;(addFormats.default || addFormats)(ajv)
const validateSchema = ajv.compile(JSON.parse(fs.readFileSync(path.join(here, "schema/lawp.schema.json"), "utf8")))

export function validate(doc) {
  const schema = validateSchema(doc) ? [] : validateSchema.errors.map(e => `${e.instancePath || "(root)"} ${e.message}`)
  return [...schema, ...lawpRules(doc)]
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": UA }, redirect: "manual", signal: AbortSignal.timeout(8000) })
  if (res.status >= 300 && res.status < 400) throw new Error(`redirects to ${res.headers.get("location")} (LAWP files must be served without redirects)`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return JSON.parse(await res.text())
}

async function discover(domain) {
  const tried = []
  for (const host of domain.startsWith("www.") ? [domain] : [domain, `www.${domain}`]) {
    const url = `https://${host}/.well-known/lawp.json`
    try { return { url, via: "/.well-known/lawp.json", doc: await getJson(url) } } catch (e) { tried.push(`${url}: ${e.message}`) }
  }
  try {
    const res = await fetch(`https://${domain}/`, { headers: { "Accept": "text/html", "User-Agent": UA }, signal: AbortSignal.timeout(8000) })
    const header = (res.headers.get("link") || "").split(/,(?=\s*<)/).map(p => p.match(/<([^>]+)>\s*;(.*)$/)).find(m => m && /rel\s*=\s*"?lawp"?/i.test(m[2]))
    let url = header ? new URL(header[1], res.url).toString() : null, via = "a Link header on the homepage"
    if (!url) {
      const head = (await res.text()).slice(0, 300000).split(/<\/head>/i)[0]
      const tag = (head.match(/<link\b[^>]*>/gi) || []).find(t => /\brel\s*=\s*["']?lawp["']?/i.test(t))
      const href = tag?.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]
      if (href) { url = new URL(href, res.url).toString(); via = `<link rel="lawp"> on the homepage` }
    }
    if (url) { try { return { url, via, doc: await getJson(url) } } catch (e) { tried.push(`${url}: ${e.message}`) } }
    else tried.push(`https://${domain}/: no <link rel="lawp"> or Link header`)
  } catch (e) { tried.push(`https://${domain}/: ${e.message}`) }
  try {
    const res = await fetch(`https://${domain}/robots.txt`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) })
    const line = res.ok ? (await res.text()).match(/^\s*LAWP\s*:\s*(\S+)/mi) : null
    if (line) { try { return { url: line[1], via: "a LAWP: line in robots.txt", doc: await getJson(line[1]) } } catch (e) { tried.push(`${line[1]}: ${e.message}`) } }
    else tried.push(`https://${domain}/robots.txt: no LAWP: line`)
  } catch (e) { tried.push(`robots.txt: ${e.message}`) }
  return { tried }
}

function report(doc) {
  const problems = validate(doc)
  if (problems.length) { for (const p of problems) bad(p) } else ok("Valid LAWP " + (doc.lawp_version || "(add \"lawp_version\": \"0.4\")"))
  const actions = Array.isArray(doc.actions) ? doc.actions : []
  console.log(`  ${Object.keys(doc.pages || {}).length} pages, ${actions.length} actions${doc.business ? ", business details" : ""}`)
  for (const a of actions) {
    const bits = [a.endpoint ? c(32, "executable") : "not executable", a.modes?.includes("quote") ? "quotes" : null, a.account && a.account !== "none" ? `account: ${a.account}` : null].filter(Boolean)
    console.log(`  • ${a.id} ${c(2, `(${bits.join(", ")})`)}`)
    if (a.endpoint && !a.safety) warn(`    ${a.id}: add "safety" so agents know when to ask the user first`)
    if (a.endpoint && !a.output) warn(`    ${a.id}: add "output.fields" to describe the response`)
  }
  return problems.length === 0
}

const [cmd, arg, arg2] = process.argv.slice(2)

async function main() {
  if (cmd === "validate" && arg) {
    const doc = JSON.parse(fs.readFileSync(arg, "utf8"))
    return report(doc) ? 0 : 1
  }
  if (cmd === "check" && arg) {
    const domain = bare(arg.replace(/^https?:\/\//, "").split("/")[0])
    console.log(`Looking for ${domain}'s LAWP…`)
    const found = await discover(domain)
    if (!found.doc) { bad(`No LAWP found for ${domain}`); for (const t of found.tried) console.log(`  ${c(2, t)}`); console.log(`\nCreate one: npx @actuent/lawp init ${domain} > lawp.json`); return 1 }
    ok(`Found via ${found.via}: ${found.url}`)
    if (found.doc.domain && bare(found.doc.domain) !== domain) bad(`"domain" is ${found.doc.domain}, not ${domain}`)
    return report(found.doc) ? 0 : 1
  }
  if (cmd === "init" && arg) {
    const domain = bare(arg.replace(/^https?:\/\//, "").split("/")[0])
    let site = null
    try {
      const data = await fetch(`https://api.actuent.ai/api/search?q=${encodeURIComponent(domain)}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) }).then(r => r.json())
      site = (data.results || []).find(r => bare(r.domain) === domain) || null
    } catch {}
    const doc = {
      lawp_version: "0.4", domain, name: site?.name || domain, language: "en",
      pages: site?.pages && Object.keys(site.pages).length ? site.pages : { "/": { title: domain, content: "Describe what you do, where, and for whom, in plain English." } },
      actions: (site?.actions?.length ? site.actions : [{ id: "contact", name: "Contact", description: `Send a message to ${domain}`, intent: ["contact", "message", "email"], input: { type: "text", required: true } }])
        .map(({ endpoint, ...a }) => ({ ...a, safety: a.safety || { requires_confirmation: true, costs_money: false, reversible: false, destructive: false } }))
    }
    process.stdout.write(JSON.stringify(doc, null, 2) + "\n")
    console.error(c(2, `\n${site ? "Started from what Actuent knows about the site." : "Starter file."} Edit it, then publish it at https://${domain}/.well-known/lawp.json (or link it: <link rel="lawp" href="…">) and run: npx @actuent/lawp check ${domain}`))
    return 0
  }
  if (cmd === "test" && arg && arg2) {
    const domain = bare(arg.replace(/^https?:\/\//, "").split("/")[0])
    const res = await fetch("https://agents.actuent.ai/api/lawp-check", {
      method: "POST", headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({ domain, action_id: arg2 })
    }).then(r => r.json()).catch(e => ({ error: e.message }))
    if (res.executed || res.quote !== undefined) ok(`${arg2} answered HTTP ${res.status}${res.response?.verified_with ? ` (signature verified with ${res.response.verified_with})` : ""}`)
    else bad(res.error || `HTTP ${res.status}`)
    console.log(JSON.stringify(res.response ?? res, null, 2))
    return res.executed ? 0 : 1
  }
  console.log(`lawp — tools for LAWP, the format that makes websites readable and actionable by AI agents

  npx @actuent/lawp check <domain>           find and validate a site's LAWP
  npx @actuent/lawp validate <file>          validate a local lawp.json
  npx @actuent/lawp init <domain> > lawp.json  write a starter file
  npx @actuent/lawp test <domain> <action>   send a signed test request to an action endpoint

Spec: https://github.com/localilabs/lawp · Generator: https://docs.actuent.ai/generator`)
  return cmd ? 1 : 0
}

main().then(code => process.exit(code ?? 0), e => { bad(e.message); process.exit(1) })
