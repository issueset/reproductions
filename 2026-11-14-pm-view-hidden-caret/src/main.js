import { Schema } from 'prosemirror-model'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { EditorState, Plugin } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>Each editor holds one closed <code>&lt;details&gt;</code>. The browser hides everything in it
except the <code>&lt;summary&gt;</code>.</p>
<p>Click the frame of the box (the arrow, the border, or the padding) to expand or collapse it.
The <code>open</code> state is a node attribute, so ProseMirror renders it. Clicking text edits it.</p>
<p>To see the bug, keep the box closed. Click the empty space in the editor below the box, then type a letter.</p>
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
      attrs: { open: { default: false } },
      parseDOM: [{ tag: 'details', getAttrs: (dom) => ({ open: dom.hasAttribute('open') }) }],
      toDOM: (node) => ['details', node.attrs.open ? { open: '' } : {}, 0],
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

// The `open` attr owns the open state. A press on the frame of a `<details>`
// (its border, padding, or the `::before` arrow) targets the `<details>`
// element itself and toggles the attr. A press on text targets a child and
// edits as usual.
const detailsToggle = new Plugin({
  props: {
    handleDOMEvents: {
      mousedown(view, event) {
        const target = event.target
        if (event.button !== 0 || !(target instanceof HTMLElement) || target.nodeName !== 'DETAILS') return false
        const pos = view.posAtDOM(target, 0) - 1
        const node = view.state.doc.nodeAt(pos)
        if (node?.type !== schema.nodes.details) return false
        event.preventDefault()
        view.dispatch(view.state.tr.setNodeAttribute(pos, 'open', !node.attrs.open))
        return true
      },
      // Stop the native toggle that WebKit runs on a click in `<summary>`.
      click(_view, event) {
        if (event.target instanceof Element && event.target.closest('summary')) event.preventDefault()
        return false
      },
    },
  },
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
    state: EditorState.create({ doc: createDoc(), plugins: [detailsToggle] }),
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
    view.updateState(EditorState.create({ doc: createDoc(), plugins: [detailsToggle] }))
    logElement.textContent = ''
  })
  host.after(reset)
}
