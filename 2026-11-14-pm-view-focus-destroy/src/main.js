import { schema } from 'prosemirror-schema-basic'
import { EditorState, NodeSelection } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>Click the button under each editor. It creates an editor whose selection is a <code>NodeSelection</code>
on the horizontal rule, calls <code>view.focus()</code>, and calls <code>view.destroy()</code> right away.
The log shows uncaught errors in the next 100ms.</p>
<p>In Safari, 1.43.0-beta3 throws <code>TypeError: null is not an object (evaluating 'view.docView.descAt')</code>
about 20ms later. 1.42.9 has no error. Chrome and Firefox have no error in both versions.</p>
<p>Cause: in Safari the <code>focus</code> event fires before the DOM selection is inside the editor, so
<code>handlers.focus</code> stores a null range and schedules <code>view.domSel.sync()</code> with
<code>setTimeout(..., 20)</code>. After <code>destroy()</code>, <code>readRange()</code> also returns the null
range (the editor DOM is detached), the two ranges are equal, and the timer calls <code>sync()</code> on the
destroyed view. <code>syncNodeSelection()</code> then reads <code>view.docView</code>, which is <code>null</code>.
The timer does not check <code>view.isDestroyed</code>.</p>
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
