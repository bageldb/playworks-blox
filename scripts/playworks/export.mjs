import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import {
  collections, draftFiltered, migrationTag, readSourceToken, snapshotPath,
  sourceDirectory, toRecord,
} from './content.mjs';

// Load the installed SDK, never execute prebuild.js or write to the original project.
const require = createRequire(`${sourceDirectory}/package.json`);
const Bagel = require('@bageldb/bagel-db');
const sortFields = {
  games: '_rank', creators: '_rank', news: 'date', tvChannels: '_createdDate',
  partners: 'order', faq: 'order',
};

async function main() {
  const db = new Bagel(await readSourceToken());
  const snapshot = {
    format: migrationTag,
    exported_at: new Date().toISOString(),
    source: 'Play.Works public BagelDB editorial collections',
    complete: false,
    collections: {},
    errors: [],
  };
  for (const name of collections) {
    try {
      const all = [];
      const seen = new Set();
      // The live API caps even .everything() at 100. Explicitly page to exhaustion.
      for (let page = 1; ; page++) {
        let query = db.collection(name).perPage(100).pageNumber(page);
        if (draftFiltered.has(name)) query = query.query('draft', '=', false);
        if (sortFields[name]) query = query.sort(sortFields[name], name === 'news' ? 'desc' : 'asc');
        const result = await query.get();
        if (!Array.isArray(result.data)) throw new Error('Unexpected response shape');
        if (result.data.length === 0) break;
        for (const item of result.data) {
          if (!item._id || seen.has(item._id)) throw new Error('Invalid/repeating pagination identity');
          seen.add(item._id);
          all.push(item);
        }
        const total = Number(result.headers?.['item-count']);
        if (Number.isFinite(total) && all.length >= total) break;
      }
      const records = all.filter((item) => item.draft !== true);
      snapshot.collections[name] = records.map((item, index) => toRecord(name, item, index));
      console.log(`${name}: ${records.length}`);
    } catch (error) {
      // SDK errors can embed request headers: never serialize or print the error.
      const status = error.response?.status ?? error.status ?? null;
      snapshot.errors.push({ collection: name, status, reason: 'Public content read failed' });
      console.error(`${name}: failed${status ? ` (HTTP ${status})` : ''}`);
    }
  }
  snapshot.complete = snapshot.errors.length === 0;
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });
  if (!snapshot.complete) process.exitCode = 1;
}

main().catch(() => {
  console.error('Export failed; credential and SDK error details intentionally suppressed.');
  process.exitCode = 1;
});
