// Rules for LAWP documents that JSON Schema can't express. Returns a list of problems (empty = OK).
// Used by the conformance tests and by validators such as the Actuent LAWP Checker.

// Standard action types (v0.5): the fields each one must take, so agents know exactly what to ask.
// [name, allowed field types]; "contact" is email or phone (at least one of them).
export const ACTION_TYPES = {
  book_table: { fields: [["date", ["date"]], ["time", ["time"]], ["party_size", ["integer", "number"]], ["name", ["string"]]], contact: true },
  book_appointment: { fields: [["date", ["date"]], ["time", ["time"]], ["service", ["string", "enum"]], ["name", ["string"]]], contact: true },
  check_availability: { fields: [["date", ["date"]]], output: ["available"] },
  request_quote: { fields: [["description", ["string"]], ["name", ["string"]]], contact: true },
  contact: { fields: [["name", ["string"]], ["message", ["string"]]], contact: true },
  order: { fields: [["items", ["string"]], ["name", ["string"]]], contact: true },
  search: { fields: [["query", ["string"]]] },
  subscribe: { fields: [["email", ["email"]]] }
}

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
    const std = a?.type ? ACTION_TYPES[a.type] : null
    if (a?.type && !std) problems.push(`actions.${a.id}.type: "${a.type}" isn't a standard type (${Object.keys(ACTION_TYPES).join(", ")}); leave it out for a custom action`)
    if (std) {
      const fields = a.input?.type === "object" ? (a.input.fields || []) : null
      if (!fields) problems.push(`actions.${a.id}.type: a "${a.type}" action takes named fields (input.type "object")`)
      else {
        const byName = new Map(fields.map(f => [f?.name, f]))
        for (const [name, types] of std.fields) {
          const f = byName.get(name)
          if (!f) problems.push(`actions.${a.id}: a "${a.type}" action needs a "${name}" field`)
          else if (!types.includes(f.type || "string")) problems.push(`actions.${a.id}.${name}: should be ${types.join(" or ")}`)
        }
        if (std.contact && !byName.has("email") && !byName.has("phone")) problems.push(`actions.${a.id}: a "${a.type}" action needs an "email" or "phone" field`)
      }
      for (const out of std.output || []) if (!(a.output?.fields || []).some(f => f?.name === out)) problems.push(`actions.${a.id}.output: a "${a.type}" action returns "${out}"`)
    }
  }
  for (const o of doc?.business?.offers || []) if (o?.action && !ids.includes(o.action)) problems.push(`business.offers: "${o.name}" points to unknown action "${o.action}"`)
  for (const [lang, t] of Object.entries(doc?.translations || {})) {
    for (const id of Object.keys(t?.actions || {})) if (!ids.includes(id)) problems.push(`translations.${lang}.actions: unknown action "${id}"`)
    if (lang === (doc.language || "en")) problems.push(`translations.${lang}: same as the document's own language`)
  }
  for (const url of doc?.more_pages || []) if (!onSite(url)) problems.push(`more_pages: ${url} must be on ${site}`)
  return problems
}
