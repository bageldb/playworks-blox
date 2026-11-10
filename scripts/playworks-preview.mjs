import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'
import { createHomepage, globalBlocks } from './playworks-home.mjs'

const snapshot = JSON.parse(await readFile(new URL('./playworks/public-content.json', import.meta.url), 'utf8'))
const page = createHomepage(snapshot)
const context = {
  $website: { global_blocks: Object.fromEntries(globalBlocks.map(block => [block.type, block.props])) },
}
const payload = JSON.stringify({ type: 'BLOX_INIT', page: { page, contexts: context }, locale: 'en' }).replaceAll('<', '\\u003c')
const server = await createServer({
  server: { host: '127.0.0.1', port: 5188, strictPort: true },
})
server.middlewares.use('/__playworks_reference', (_request, response) => {
  response.setHeader('Content-Type', 'text/html')
  response.end(`<!doctype html><html><head><title>Play.Works Blox conversion preview</title></head>
<body style="margin:0"><iframe id="preview" src="/_blox_preview" style="width:100%;height:100vh;border:0"></iframe>
<script>addEventListener('message',event=>{if(event.source===document.getElementById('preview').contentWindow&&event.data?.type==='BLOX_READY'){event.source.postMessage(${payload},location.origin)}})</script></body></html>`)
})
await server.listen()
server.printUrls()
