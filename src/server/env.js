import fs from 'node:fs'
import path from 'node:path'

export function loadEnv(cwd = process.cwd()) {
  const envPath = path.join(cwd, '.env')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf8')

  // Parse the whole file first so a duplicated key takes its LAST value
  // (matching dotenv); applying line-by-line would let the first occurrence
  // win and silently shadow a corrected value lower in the file.
  const parsed = {}
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const separator = trimmed.indexOf('=')
    if (separator < 0) return

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (key) parsed[key] = value
  })

  // Real environment variables (shell/CI) still win over .env values.
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}
