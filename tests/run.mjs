// Conformance tests: every file in tests/valid must pass, every file in tests/invalid must fail.
import fs from "fs"
import path from "path"
import Ajv from "ajv/dist/2020.js"
import addFormats from "ajv-formats"
import { lawpRules } from "../rules.mjs"

const root = path.dirname(new URL(import.meta.url).pathname)
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(JSON.parse(fs.readFileSync(path.join(root, "../schema/lawp.schema.json"), "utf8")))

export function check(doc) {
  const schemaOk = validate(doc)
  const schemaErrors = schemaOk ? [] : validate.errors.map(e => `${e.instancePath || "/"} ${e.message}`)
  return [...schemaErrors, ...lawpRules(doc)]
}

let failed = 0
for (const kind of ["valid", "invalid"]) {
  for (const file of fs.readdirSync(path.join(root, kind)).filter(f => f.endsWith(".json")).sort()) {
    const problems = check(JSON.parse(fs.readFileSync(path.join(root, kind, file), "utf8")))
    const pass = kind === "valid" ? problems.length === 0 : problems.length > 0
    if (!pass) failed++
    console.log(`${pass ? "ok  " : "FAIL"} ${kind}/${file}${problems.length ? ` — ${problems[0]}` : ""}`)
  }
}
console.log(failed ? `\n${failed} failed` : "\nAll conformance tests passed")
process.exit(failed ? 1 : 0)
