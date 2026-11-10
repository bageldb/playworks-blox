import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const sourceDirectory = fileURLToPath(new URL('../../../play-works/', import.meta.url));
export const snapshotPath = fileURLToPath(new URL('./public-content.json', import.meta.url));
export const migrationTag = 'playworks-public-v1';
// Only editorial collections rendered by the public site. Never enumerate collections.
export const collections = [
  'games', 'news', 'newsletter', 'team', 'creators', 'careers', 'partners',
  'legal', 'tvChannels', 'videoPages', 'topGraphicsAnimation', 'faq',
];
export const draftFiltered = new Set([
  'games', 'news', 'newsletter', 'team', 'creators', 'careers', 'tvChannels', 'videoPages',
]);

// Exact original prebuild.js implementation, intentionally not modern slugification.
export function slugify(str) {
  str = str.toLowerCase().match(/[\w\d\s]/g, '').join('').replace(/\s+/g, '-');
  return encodeURIComponent(str);
}

export async function readSourceToken() {
  for (const filename of ['.env', 'prebuild.js']) {
    let text;
    try {
      text = await readFile(`${sourceDirectory}/${filename}`, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw new Error('Cannot read original source credential file');
    }
    const match = text.match(/(?:^|\n)\s*(?:const\s+)?VUE_APP_BAGEL_TOKEN\s*=\s*["']?([^"'\s;]+)/);
    if (match) return match[1];
  }
  throw new Error('Original BagelDB credential was not found');
}

const privateKey = /^(?:.*(?:password|secret|token|authorization|apiKey)|_createdBy|_updatedBy|_owner|_permissions)$/i;
export function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(([key]) => !privateKey.test(key))
        .map(([key, entry]) => [key, sanitize(entry)]),
    );
  }
  if (typeof value === 'string' && /eyJ[\w-]+\.[\w-]+\.[\w-]+/.test(value)) {
    throw new Error('Possible credential in public content; refusing snapshot');
  }
  return value;
}

export function toRecord(collection, item, index) {
  if (typeof item._id !== 'string' || !item._id) {
    throw new Error(`Missing source identity: ${collection} record ${index}`);
  }
  const record = {
    ...sanitize(item),
    source_id: item._id,
    source_collection: collection,
    source_order: index,
    migration_source: migrationTag,
  };
  if (collection === 'news' || collection === 'newsletter') record.slug = slugify(item.title);
  return record;
}

export async function loadSnapshot() {
  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
  if (snapshot.format !== migrationTag || !snapshot.complete) {
    throw new Error('Snapshot is incomplete or uses an unsupported format; export again');
  }
  if (Object.keys(snapshot.collections).some((name) => !collections.includes(name))) {
    throw new Error('Snapshot contains a non-allowlisted collection');
  }
  for (const name of collections) {
    const records = snapshot.collections[name];
    if (!Array.isArray(records)) throw new Error(`Missing collection: ${name}`);
    const ids = new Set();
    for (const record of records) {
      if (record.migration_source !== migrationTag || record.source_collection !== name ||
          !record.source_id || ids.has(record.source_id)) {
        throw new Error(`Invalid or duplicate source identity in ${name}`);
      }
      ids.add(record.source_id);
    }
  }
  sanitize(snapshot);
  return snapshot;
}
