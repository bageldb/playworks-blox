import { readFile } from 'node:fs/promises'

const base = 'https://app.bagel.to'
const site = '23035e81-3ff4-49af-9fcf-509dc735ab44'
const token = process.env.APP_SESSION_TOKEN
if (!token) throw new Error('APP_SESSION_TOKEN is required')
const source = await readFile(new URL('../../play-works/src/views/Contact.vue', import.meta.url), 'utf8')
const text = value => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
const paragraphs = [...source.split('<div class="form-wrap">')[0].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(match => text(match[1]))
const props = {
  title: 'Let’s Connect', decoration: '/playworks/pattern1 blue copy 4.svg',
  introduction: paragraphs[0], opportunities: paragraphs[1], email: 'contact@play.works',
  support_text: paragraphs[3], form_name: 'playworks-contact',
  platforms: [...source.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)]
    .map(match => ({ value: match[1], label: match[2] })),
}
async function api(method, path, body) {
  const response = await fetch(base + path, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status}`)
  return response.json()
}
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify(props, null, 2))
} else {
  const pages = await api('GET', `/blox/websites/${site}/pages`)
  const page = pages.find(item => item.slug === '/contact-us')
  if (!page) throw new Error('Contact page missing')
  await api('PUT', `/blox/websites/${site}/pages/${page.id}`, { content: { blocks: [
    { type: 'PlayNavigation', props: {} },
    { type: 'PlayContact', props },
    { type: 'PlayFooter', props: {} },
  ] } })
  console.log('Updated contact draft composition')
}
