// Dev tool: screenshot the app at phone size with headless Chrome, bypassing the
// service worker and the first-launch info sheet.
//   node scripts/screenshot.mjs <out.png> [url] [js-to-run-before-shot]
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const [out = 'shot.png', url = 'http://127.0.0.1:8794/', pre = ''] = process.argv.slice(2)
const port = 9222 + Math.floor(Math.random() * 500)
const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, '--user-data-dir=/tmp/cb-shot-' + port,
  '--window-size=390,844', 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  let targets = []
  for (let i = 0; i < 50 && !targets.length; i++) {
    await sleep(200)
    targets = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).catch(() => [])
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const pending = new Map()
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id) } }
  const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })) })
  await send('Network.enable')
  await send('Network.setBypassServiceWorker', { bypass: true })
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await send('Page.enable')
  await send('Page.navigate', { url })
  await sleep(2500)
  await send('Runtime.evaluate', { expression: `(async()=>{document.querySelector('[data-role=info-close]')?.click(); ${pre}})()`, awaitPromise: true })
  await sleep(600)
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
  console.log('wrote', out)
} finally {
  chrome.kill()
}
