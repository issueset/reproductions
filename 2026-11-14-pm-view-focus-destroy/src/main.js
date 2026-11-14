import { schema } from 'prosemirror-schema-basic'
import { EditorState, NodeSelection } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>The button creates an editor with a <code>NodeSelection</code>, calls <code>view.focus()</code>,
then <code>view.destroy()</code>.</p>
<p>In Safari, 1.43.0-beta3 throws <code>TypeError: null is not an object</code> about 20ms later:
the <code>setTimeout</code> in the <code>focus</code> handler calls <code>view.domSel.sync()</code>
without checking <code>view.isDestroyed</code>.</p>
`)

let current = null
window.addEventListener('error', (event) => {
  if (!current) return
  current.log(`uncaught error: ${event.message}`)
  current.errors++
})

for (const version of versions) {
  const host = document.querySelector(`#${version.id}`)
  const logElement = document.querySelector(`#${version.id}-log`)
  const log = (line) => {
    logElement.textContent += `${line}\n`
  }

  const button = document.createElement('button')
  button.textContent = 'Create, focus(), destroy()'
  button.addEventListener('click', () => {
    logElement.textContent = ''
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello world')]),
      schema.node('horizontal_rule'),
    ])
    const selection = NodeSelection.create(doc, doc.firstChild.nodeSize)
    const view = new version.EditorView(host, { state: EditorState.create({ doc, selection }) })
    const record = { log, errors: 0 }
    current = record
    view.focus()
    view.destroy()
    log('created, focused, and destroyed the view')
    setTimeout(() => {
      log(record.errors ? `${record.errors} uncaught error(s)` : 'no uncaught error')
      if (current === record) current = null
    }, 100)
  })
  host.after(button)
}
