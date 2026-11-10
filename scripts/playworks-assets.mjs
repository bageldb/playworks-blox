import { cp, mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname, join } from 'node:path'

const source = fileURLToPath(new URL('../../play-works/src/assets/', import.meta.url))
const target = fileURLToPath(new URL('../public/playworks/', import.meta.url))
const extensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2'])
await mkdir(target, { recursive: true })
let count = 0
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (!entry.isFile() || !extensions.has(extname(entry.name).toLowerCase())) continue
  await cp(join(source, entry.name), join(target, entry.name))
  count++
}
console.log(`Copied ${count} original public brand assets to public/playworks`)
