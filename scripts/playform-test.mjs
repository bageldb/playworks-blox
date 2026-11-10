import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transform } from 'esbuild'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { computed, reactive, ref } from 'vue'

const filename = new URL('../src/components/blocks/PlayForm.vue', import.meta.url)
const source = await readFile(filename, 'utf8')
const { descriptor } = parse(source)
const code = (await transform(descriptor.scriptSetup.content.replace(/^import .*$/gm, ''), { loader: 'ts' })).code
const create = (props, fetch) => new Function('computed', 'reactive', 'ref', 'useId', 'defineProps', 'withDefaults', 'defineSchema', 'defineBlock', '$', 'fetch',
	`${code}; return { form, screenshot, uploadScreenshot, submit, error, uploadError, done, uploading, sending, platforms };`
)(computed, reactive, ref, () => 'test', () => props, (value, defaults) => ({ ...defaults, ...value }), value => value, () => {}, new Proxy({}, { get: () => () => ({}) }), fetch)

test('Vue script and template compile', () => {
	assert.doesNotThrow(() => compileScript(descriptor, { id: 'playform-test' }))
	assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: filename.pathname, id: 'playform-test' }).errors, [])
})

test('submits flat data and locale; no remote requests', async () => {
	const requests = []
	const form = create({ form_name: 'playworks-contact', locale: 'fr' }, async (...args) => {
		requests.push(args)
		return { ok: true }
	})
	Object.assign(form.form, { name: 'Test', platform: 'Roku' })
	await form.submit()
	assert.equal(requests[0][0], '/api/form/submit/playworks-contact')
	assert.deepEqual(JSON.parse(requests[0][1].body), {
		name: 'Test', subject: '', email: '', message: '', platform: 'Roku', _meta: { locale: 'fr' },
	})
	assert.equal(form.done.value, true)
})

test('platform validation and duplicate submission guard', async () => {
	let calls = 0
	const form = create({}, async () => { calls++; return { ok: true } })
	await form.submit()
	assert.equal(calls, 0)
	form.form.platform = 'Roku'
	form.sending.value = true
	await form.submit()
	assert.equal(calls, 0)
})

test('uploads privately and persists only an opaque screenshot reference', async () => {
	const requests = []
	const form = create({ allow_screenshot: true }, async (url, options) => {
		requests.push([url, options])
		return { ok: true, json: async () => ({ path_key: 'private/test.png', meta: { private: true }, url: 'https://do-not-use.example', download_url: 'https://do-not-persist.example' }) }
	})
	await form.uploadScreenshot(new File(['png'], 'test.png', { type: 'image/png' }))
	assert.equal(requests[0][0], '/api/files/upload')
	assert.equal(requests[0][1].body.get('private'), 'true')
	form.form.platform = 'Roku'
	await form.submit()
	const body = JSON.parse(requests[1][1].body)
	assert.deepEqual(body.screenshot, { path_key: 'private/test.png', name: 'test.png', mimetype: 'image/png', size: 3 })
	assert.ok(!requests[1][1].body.includes('https://'))
})

test('rejects public upload responses, unsupported types and oversize files', async () => {
	let calls = 0
	const form = create({}, async () => { calls++; return { ok: true, json: async () => ({ path_key: 'public.png', meta: {} }) } })
	await assert.rejects(form.uploadScreenshot(new File(['x'], 'x.png', { type: 'image/png' })))
	assert.equal(form.screenshot.value, undefined)
	await assert.rejects(form.uploadScreenshot(new File(['x'], 'x.svg', { type: 'image/svg+xml' })))
	await assert.rejects(form.uploadScreenshot(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })))
	assert.equal(calls, 1)
	assert.equal(form.uploading.value, false)
})

test('failed submissions preserve input and show a retry error', async () => {
	const form = create({}, async () => ({ ok: false }))
	form.form.platform = 'Roku'
	form.form.message = 'Preserve me'
	await form.submit()
	assert.equal(form.done.value, false)
	assert.ok(form.error.value)
	assert.equal(form.form.message, 'Preserve me')
	assert.equal(form.sending.value, false)
})
