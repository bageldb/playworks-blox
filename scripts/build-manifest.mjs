import assert from 'node:assert/strict'
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const server = await createServer({
  root,
  logLevel: 'warn',
  server: { middlewareMode: true, hmr: false },
})
try {
  const { buildManifest } = await server.ssrLoadModule('/src/manifest.ts')
  const manifest = buildManifest()
  assert.ok(manifest.blocks.length > 0, 'Composed block manifest is empty')
  const names = new Set(manifest.blocks.map(block => block.type))
  const { sharedBlockModules } = await server.ssrLoadModule('@bageldb/blox-renderer')
  const siteFiles = await readdir(new URL('../src/components/blocks/', import.meta.url))
  const expected = [
    ...Object.keys(sharedBlockModules),
    ...siteFiles.filter(name => name.endsWith('.vue')).map(name => name.slice(0, -4)),
  ]
  for (const name of expected) {
    assert.ok(names.has(name), `Composed manifest omitted block: ${name}`)
  }
  assert.equal(manifest.blocks.length, names.size, 'Duplicate block names in manifest')
  await mkdir(new URL('../dist/', import.meta.url), { recursive: true })
  await writeFile(new URL('../dist/.blox-manifest.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Verified composed manifest: ${manifest.blocks.length} shared + site blocks`)
} finally {
  await server.close()
}
