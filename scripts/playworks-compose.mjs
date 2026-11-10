import { readFile } from 'node:fs/promises'
import { createHomepage, globalBlocks } from './playworks-home.mjs'
import { createPages } from './playworks-pages.mjs'

const origin = 'https://app.bagel.to'
const snapshot = JSON.parse(await readFile(new URL('./playworks/public-content.json', import.meta.url), 'utf8'))
const homepage = createHomepage(snapshot)
const pages = [...new Map([homepage, ...createPages(snapshot)].map(page => [page.slug, page])).values()]
for (const page of pages) {
  for (const block of page.content.blocks) {
    if (block.type === 'PlayContent') block.props.asset_base = '/playworks/'
    if (block.props.html) block.props.html = block.props.html.replaceAll('/playworks/assets/', '/playworks/')
    if (block.type === 'FormBlock') {
      block.type = 'PlayForm'
      block.props.platforms = block.props.fields.find(field => field.name === 'platform').options
    }
  }
}
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ mode: 'plan', pages: pages.map(page => ({ slug: page.slug, blocks: page.content.blocks.map(block => block.type) })) }, null, 2))
} else {
  const token = process.env.APP_SESSION_TOKEN
  if (!token) throw new Error('APP_SESSION_TOKEN is required')
  const receipt = JSON.parse(await readFile(new URL('./playworks/migration-receipt.json', import.meta.url), 'utf8'))
  if (receipt.origin !== origin || receipt.store !== 'playworks') throw new Error('Invalid migration target')
  const id = receipt.website_id
  async function api(method, path, body) {
    const response = await fetch(`${origin}${path}`, {
      method, redirect: 'error', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if (!response.ok) throw new Error(`${method} ${path}: ${response.status}`)
    return response.json()
  }
  for (const block of [...globalBlocks, { type: 'SiteTheme', props: {
    bg: '#ffffff', ink: '#000000', accent: '#ed4b4b', muted: '#666666',
    font_body: "'Montserrat', sans-serif", font_display: "'Montserrat', sans-serif",
    btn: '#ed4b4b', btn_ink: '#ffffff',
  } }]) {
    await api('PUT', `/blox/websites/${id}/global-blocks/${block.type}`, { props: block.props })
  }
  const existing = await api('GET', `/blox/websites/${id}/pages`)
  for (const page of pages) {
    const match = existing.find(item => item.slug === page.slug)
    if (match) {
      console.log(`Existing draft retained: ${page.slug}`)
      continue
    }
    const created = await api('POST', `/blox/websites/${id}/pages`, page)
    existing.push(created)
    console.log(`Created draft: ${page.slug}`)
  }
  console.log(`Website: ${id}`)
}
