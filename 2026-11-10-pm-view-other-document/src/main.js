import { DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { EditorState } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>Each editor's DOM element is created inside another document (the content of a
<code>&lt;template&gt;</code>, like Solid does), and then moved into this page. Click in an
editor and change the selection with Shift+Arrow keys or a mouse drag. In 1.42.9 the state
selection follows. In 1.43.0-beta2 it stays where it was, because the
<code>selectionchange</code> listener was registered on the other document.</p>
`)

for (const { id, EditorView } of versions) {
  const template = document.createElement('template')
  template.innerHTML = '<div></div>'
  const place = template.content.firstChild

  const container = document.createElement('div')
  container.innerHTML = '<p>Hello world, select some of this text.</p>'
  const doc = DOMParser.fromSchema(schema).parse(container)
  const view = new EditorView(place, { state: EditorState.create({ doc }) })
  document.querySelector(`#${id}`).append(place)

  const logElement = document.querySelector(`#${id}-log`)
  const render = () => {
    const { from, to } = view.state.selection
    logElement.textContent = `state selection: ${from}-${to} ${JSON.stringify(view.state.doc.textBetween(from, to))}\nDOM selection: ${JSON.stringify(view.hasFocus() ? document.getSelection()?.toString() : '')}`
  }
  render()
  document.addEventListener('selectionchange', () => setTimeout(render, 50))
}
