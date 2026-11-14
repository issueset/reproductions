import { Schema } from 'prosemirror-model'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { EditorState } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>Each editor holds one closed <code>&lt;details&gt;</code>. The browser hides everything in it
except the <code>&lt;summary&gt;</code>.</p>
<p>Click the empty space in the editor below "Details", then type a letter.</p>
<ul>
  <li>1.42.9: the browser places the caret at the end of "Details", the closest visible text.
  The letter goes there.</li>
  <li>1.43.0-beta3: ProseMirror places the caret with <code>posAtCoords</code> and
  <code>TextSelection.near</code>. The click maps to the end of the document, and
  <code>TextSelection.near</code> picks the last textblock, the hidden paragraph. No caret is visible.
  In Firefox the letter goes into the hidden paragraph.</li>
</ul>
`)

const schema = new Schema({
  nodes: basicSchema.spec.nodes.append({
    details: {
      group: 'block',
      content: 'summary details_content',
      parseDOM: [{ tag: 'details' }],
      toDOM: () => ['details', 0],
    },
    summary: {
      content: 'text*',
      parseDOM: [{ tag: 'summary' }],
      toDOM: () => ['summary', 0],
    },
    details_content: {
      content: 'block+',
      parseDOM: [{ tag: 'div.details-content' }],
      toDOM: () => ['div', { class: 'details-content' }, 0],
    },
  }),
  marks: basicSchema.spec.marks,
})

function createDoc() {
  const { nodes } = schema
  return nodes.doc.create(null, [
    nodes.details.create(null, [
      nodes.summary.create(null, schema.text('Details')),
      nodes.details_content.create(null, [
        nodes.paragraph.create(null, schema.text('Something small enough to escape casual notice.')),
      ]),
    ]),
  ])
}

function describeCaret(view) {
  const { selection, doc } = view.state
  const $head = doc.resolve(selection.head)
  const parent = $head.parent
  const dom = view.dom.ownerDocument.getSelection()
  let node = dom?.focusNode ?? null
  if (node && node.nodeType !== 1) node = node.parentElement
  const hidden = !!node?.closest('details:not([open]) > :not(summary)')
  return `state caret: ${selection.head} in ${parent.type.name} ${JSON.stringify(parent.textContent)}\nDOM caret in hidden content: ${hidden}`
}

for (const version of versions) {
  const host = document.querySelector(`#${version.id}`)
  const logElement = document.querySelector(`#${version.id}-log`)
  const view = new version.EditorView(host, {
    state: EditorState.create({ doc: createDoc() }),
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr))
      if (tr.docChanged) logElement.textContent = `${describeCaret(view)}\ndoc: ${view.state.doc.toString()}`
    },
  })
  view.dom.addEventListener('mouseup', () => {
    setTimeout(() => {
      logElement.textContent = describeCaret(view)
    }, 50)
  })
  const reset = document.createElement('button')
  reset.textContent = 'Reset'
  reset.addEventListener('click', () => {
    view.updateState(EditorState.create({ doc: createDoc() }))
    logElement.textContent = ''
  })
  host.after(reset)
}
