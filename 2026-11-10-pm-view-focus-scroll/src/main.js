import { schema } from 'prosemirror-schema-basic'
import { EditorState, TextSelection } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>Click the button under each editor. It calls <code>view.focus()</code> and then dispatches
<code>scrollIntoView()</code> to the end, in one tick. In 1.43.0-beta2 on Safari the editor does not scroll.
Chrome and Firefox scroll in both versions.</p>
`)

for (const { id, EditorView } of versions) {
  const host = document.querySelector(`#${id}`)
  host.style.height = '200px'
  host.style.overflow = 'auto'
  const doc = schema.node('doc', null, Array.from({ length: 60 }, (_, i) => schema.node('paragraph', null, [schema.text(`Line ${i + 1}`)])))
  const view = new EditorView(host, { state: EditorState.create({ doc }) })
  const logElement = document.querySelector(`#${id}-log`)

  const button = document.createElement('button')
  button.textContent = 'focus() + scrollIntoView() to the end'
  button.addEventListener('mousedown', (event) => event.preventDefault())
  button.addEventListener('click', () => {
    host.scrollTop = 0
    view.dom.blur()
    view.focus()
    const end = view.state.doc.content.size - 1
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, end)).scrollIntoView())
    logElement.textContent = `scrollTop after dispatch: ${host.scrollTop}`
  })
  host.after(button)
}
