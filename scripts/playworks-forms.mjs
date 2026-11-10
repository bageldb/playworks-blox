import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const source = new URL('../../play-works/src/views/', import.meta.url)

export async function formDefinitions() {
  const definitions = []
  for (const [view, name] of [['Contact', 'playworks-contact'], ['Support', 'playworks-support']]) {
    const text = await readFile(new URL(`${view}.vue`, source), 'utf8')
    const platforms = [...text.matchAll(/<option value="([^"]+)"/g)].map(match => match[1])
    definitions.push({
      name,
      description: `Play.Works ${view.toLowerCase()} form`,
      meta: { public: true },
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name', minLength: 1 },
          subject: { type: 'string', title: 'Subject', minLength: 1 },
          email: { type: 'string', title: 'Email', format: 'email' },
          message: { type: 'string', title: 'Message', minLength: 1 },
          platform: { type: 'string', title: 'Platform', enum: platforms },
        },
        required: ['name', 'email', 'subject', 'message', 'platform'],
      },
    })
  }
  return definitions
}

export async function migrateForms(token, origin = 'https://app.bagel.to') {
  if (!token) throw new Error('APP_SESSION_TOKEN is required')
  if (new URL(origin).origin !== 'https://app.bagel.to') throw new Error('Unexpected target origin')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const response = await fetch(`${origin}/form/?limit=1000`, { headers })
  if (!response.ok) throw new Error(`List form definitions failed: ${response.status}`)
  const existing = await response.json()
  const results = []
  for (const definition of await formDefinitions()) {
    const match = existing.find(item => item.name === definition.name)
    if (match) {
      results.push({ name: match.name, id: match.id, created: false })
      continue
    }
    const created = await fetch(`${origin}/form/definitions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(definition),
    })
    if (!created.ok) throw new Error(`Create ${definition.name} failed: ${created.status}`)
    const result = await created.json()
    results.push({ name: result.name, id: result.id, created: true })
  }
  return results
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = process.argv.includes('--apply')
    ? await migrateForms(process.env.APP_SESSION_TOKEN)
    : await formDefinitions()
  console.log(JSON.stringify(result, null, 2))
}
