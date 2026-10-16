// Turns the dist-artifact build into one self-contained HTML page.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const dir = 'dist-artifact/assets'
const files = readdirSync(dir)
const js = files.filter(f => f.endsWith('.js')).map(f => readFileSync(`${dir}/${f}`, 'utf8'))
const css = files.filter(f => f.endsWith('.css')).map(f => readFileSync(`${dir}/${f}`, 'utf8')).join('\n')
if (js.length !== 1) throw new Error(`expected 1 JS bundle, got ${js.length}`)

const page = `<title>Daytrack</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<style>${css}
/* The artifact frame already pads the top safe area. */
:root { --safe-top: 0px; }
</style>
<div id="root"></div>
<script type="module">${js[0].replace(/<\/script/gi, '<\\/script')}</script>
`
writeFileSync('dist-artifact/daytrack.html', page)
console.log(`dist-artifact/daytrack.html ${(page.length / 1024).toFixed(0)} KB`)
