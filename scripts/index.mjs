// Regenerates index.html from the YYYY-MM-DD-* directories that have a built dist/.
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
const dirs = readdirSync('.').filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d) && existsSync(`${d}/src/index.html`)).sort().reverse()
const items = dirs.map((d) => {
  const title = /<title>(.*?)<\/title>/.exec(readFileSync(`${d}/src/index.html`, 'utf8'))?.[1] ?? d
  return `    <li><a href="./${d}/">${d}</a> ${title === d ? '' : `: ${title}`}</li>`
})
writeFileSync('index.html', `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reproductions</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 16px}a{color:#0969da}</style></head>
<body>
  <h1>Reproductions</h1>
  <ul>
${items.join('\n')}
  </ul>
</body>
</html>
`)
