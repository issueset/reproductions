import { Schema } from 'prosemirror-model'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { EditorState, Plugin } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>The paragraph inside the closed <code>&lt;details&gt;</code> is hidden.
Click the empty space below the box, then type a letter.</p>
<ul>
  <li>1.42.9: the letter goes into "Details".</li>
  <li>1.43.0-beta3: the caret goes into the hidden paragraph. In Firefox, the letter goes there too.</li>
</ul>
<p>Click the frame of the box to expand or collapse it.</p>
`)

const schema = new Schema({
  nodes: basicSchema.spec.nodes.append({
    details_root: {
      group: 'block',
      content: 'details_summary details_content',
      attrs: { open: { default: false } },
      parseDOM: [{ tag: 'details', getAttrs: (dom) => ({ open: dom.hasAttribute('open') }) }],
      toDOM: (node) => ['details', node.attrs.open ? { open: '' } : {}, 0],
    },
    details_summary: {
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
        if (node?.type !== schema.nodes.details_root) return false
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

function createState() {
  const { nodes } = schema
  const doc = nodes.doc.create(null, [
    nodes.details_root.create(null, [
      nodes.details_summary.create(null, schema.text('Details')),
      nodes.details_content.create(null, [
        nodes.paragraph.create(null, schema.text('Something small enough to escape casual notice.')),
      ]),
    ]),
  ])
  return EditorState.create({ doc, plugins: [detailsToggle] })
}

for (const version of versions) {
  const host = document.querySelector(`#${version.id}`)
  const logElement = document.querySelector(`#${version.id}-log`)
  const showDoc = () => {
    logElement.textContent = JSON.stringify(view.state.doc.toJSON(), null, 2)
  }
  const view = new version.EditorView(host, {
    state: createState(),
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr))
      if (tr.docChanged) showDoc()
    },
  })
  showDoc()

  const reset = document.createElement('button')
  reset.textContent = 'Reset'
  reset.addEventListener('click', () => {
    view.updateState(createState())
    showDoc()
  })
  host.after(reset)
}
