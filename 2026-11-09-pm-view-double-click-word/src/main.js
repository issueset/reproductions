import { createEditor, setIntro, versions } from './shared.js'

setIntro(`
<p>Double-click each word. 1.42.9 uses the browser's native word selection. 1.43.0-beta1 computes
the word itself with <code>/(?:\\p{L}|\\p{N})+/u</code> plus <code>Intl.Segmenter</code>, so
<code>don't</code> selects only <code>don</code> and <code>snake_case</code> splits at the underscore.</p>
`)

for (const version of versions) {
  const { view, log } = createEditor(version, "<p>don't snake_case e-mail 3.14 天气很好</p>")
  view.dom.addEventListener('dblclick', () => {
    setTimeout(() => {
      const { from, to } = view.state.selection
      log(`selected: ${JSON.stringify(view.state.doc.textBetween(from, to))}`)
    }, 100)
  })
}
