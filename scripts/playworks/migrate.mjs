import { readFile, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { collections, loadSnapshot, migrationTag } from './content.mjs';

const origin = 'https://app.bagel.to';
const receiptUrl = new URL('./migration-receipt.json', import.meta.url);
const marker = `${migrationTag}: public editorial content from Play.Works`;
const apply = process.argv.includes('--apply');

async function main() {
  const snapshot = await loadSnapshot();
  if (!apply) {
    console.log(JSON.stringify({
      mode: 'plan', api: origin, website: 'playworks', store: 'playworks',
      collections: Object.fromEntries(collections.map((name) => [name, snapshot.collections[name].length])),
      note: 'No writes. Set APP_SESSION_TOKEN and pass --apply to create draft content.',
    }, null, 2));
    return;
  }
  const token = process.env.APP_SESSION_TOKEN;
  if (!token) throw new Error('APP_SESSION_TOKEN is unavailable; no requests sent');
  const api = async (method, path, body) => {
    const response = await fetch(`${origin}${path}`, {
      method, redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      // Do not echo server payloads, request headers, or authentication material.
      throw new Error(`${method} ${path.split('?')[0]}: HTTP ${response.status}`);
    }
    return response.json();
  };
  let receipt;
  try {
    receipt = JSON.parse(await readFile(receiptUrl, 'utf8'));
    if (receipt.format !== migrationTag || receipt.origin !== origin) {
      throw new Error('Migration receipt belongs to a different migration');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const websites = await api('GET', '/blox/websites');
  if (!Array.isArray(websites)) throw new Error('Unexpected website list shape');
  const matches = websites.filter((website) => website.name === 'playworks');
  if (matches.length > 1) throw new Error('Ambiguous playworks website; refusing writes');
  let website = matches[0];
  const expectedId = process.env.APP_WEBSITE_ID ?? receipt?.website_id;
  if (website && website.id !== expectedId) {
    throw new Error('Existing playworks website is not owned by this receipt; confirm its ID with APP_WEBSITE_ID');
  }
  if (!website) {
    if (expectedId) throw new Error('Expected website no longer exists; refusing replacement');
    website = await api('POST', '/blox/websites', {
      name: 'playworks', default_locale: 'en', supported_locales: ['en'],
    });
  }
  if ((website.integrations?.datastore_store ?? 'playworks') !== 'playworks') {
    throw new Error('Website uses a different datastore store; refusing writes');
  }
  receipt = {
    format: migrationTag, origin, website_id: website.id, store: 'playworks',
    exported_at: snapshot.exported_at, collections: {},
  };
  const saveReceipt = () => writeFile(receiptUrl, `${JSON.stringify(receipt, null, 2)}\n`);
  await saveReceipt();
  console.log(`website_id: ${website.id}`);
  const schemas = await api('GET', '/datastore/playworks/schemas');
  for (const name of collections) {
    let schema = schemas.find((entry) => entry.collection_name === name);
    if (schema && schema.description !== marker) {
      throw new Error(`Existing unrelated schema: ${name}; refusing writes`);
    }
    if (!schema) {
      schema = await api('POST', '/datastore/playworks/schemas', {
        collection_name: name, description: marker, locales: [],
        json_schema: {
          type: 'object', additionalProperties: true,
          required: ['source_id', 'source_collection', 'source_order', 'migration_source'],
          properties: {
            source_id: { type: 'string' }, source_collection: { const: name },
            source_order: { type: 'integer' }, migration_source: { const: migrationTag },
          },
        },
      });
    }
    const path = `/datastore/playworks/collections/${encodeURIComponent(name)}`;
    const existing = [];
    for (let offset = 0; ; ) {
      const page = await api('GET', `${path}?offset=${offset}&limit=100&include_unlocalized=true`);
      if (!Array.isArray(page)) throw new Error(`Unexpected item list shape: ${name}`);
      existing.push(...page);
      if (page.length === 0) break;
      offset += page.length;
    }
    const bySource = new Map();
    for (const record of existing) {
      if (record.migration_source !== migrationTag || record.source_collection !== name ||
          !record.source_id || bySource.has(record.source_id)) {
        throw new Error(`Unrelated or duplicate record in ${name}; refusing writes`);
      }
      bySource.set(record.source_id, record);
    }
    let created = 0;
    let skipped = 0;
    const pending = [];
    for (const record of snapshot.collections[name]) {
      const previous = bySource.get(record.source_id);
      if (previous) {
        const { id, created_at, updated_at, available_locales, ...data } = previous;
        if (!isDeepStrictEqual(data, record)) {
          throw new Error(`Changed existing source ${name}/${record.source_id}; refusing overwrite`);
        }
        skipped++;
      } else {
        pending.push(record);
      }
    }
    // Bound concurrency so a full public collection fits a normal execution
    // window without flooding the API. Each source identity is unique.
    for (let offset = 0; offset < pending.length; offset += 8) {
      const batch = pending.slice(offset, offset + 8);
      await Promise.all(batch.map((record) => api('POST', path, record)));
      created += batch.length;
    }
    receipt.collections[name] = { created, skipped, total: snapshot.collections[name].length };
    await saveReceipt();
    console.log(`${name}: created ${created}, unchanged ${skipped}`);
  }
  console.log('Draft content only. No pages, deployment, or publish requests were made.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
