// Rules for LAWP documents that JSON Schema can't express. Returns a list of problems (empty = OK).
// Used by the conformance tests and by validators such as the Actuent LAWP Checker.

export function lawpRules(doc) {
  const problems = []
  const site = String(doc?.domain || "").replace(/^www\./, "")
  const actions = Array.isArray(doc?.actions) ? doc.actions : []
  const ids = actions.map(a => a?.id)
  const onSite = url => { try { const h = new URL(url).hostname.replace(/^www\./, ""); return h === site || h.endsWith(`.${site}`) } catch { return false } }

  ids.forEach((id, i) => { if (ids.indexOf(id) !== i) problems.push(`actions: "${id}" is used twice`) })
  for (const a of actions) {
    if (a?.endpoint?.url && !onSite(a.endpoint.url)) problems.push(`actions.${a.id}.endpoint: must be on ${site} or a subdomain`)
    if ((a?.account === "required" || a?.account === "optional") && !doc.accounts) problems.push(`actions.${a.id}.account: needs a root "accounts" object`)
    if (a?.scopes?.length && doc.accounts?.scopes) for (const s of a.scopes) if (!(s in doc.accounts.scopes)) problems.push(`actions.${a.id}.scopes: "${s}" isn't in accounts.scopes`)
    if (a?.modes?.includes("quote") && !a.endpoint) problems.push(`actions.${a.id}.modes: "quote" needs an endpoint`)
  }
  for (const o of doc?.business?.offers || []) if (o?.action && !ids.includes(o.action)) problems.push(`business.offers: "${o.name}" points to unknown action "${o.action}"`)
  for (const [lang, t] of Object.entries(doc?.translations || {})) {
    for (const id of Object.keys(t?.actions || {})) if (!ids.includes(id)) problems.push(`translations.${lang}.actions: unknown action "${id}"`)
    if (lang === (doc.language || "en")) problems.push(`translations.${lang}: same as the document's own language`)
  }
  for (const url of doc?.more_pages || []) if (!onSite(url)) problems.push(`more_pages: ${url} must be on ${site}`)
  return problems
}
