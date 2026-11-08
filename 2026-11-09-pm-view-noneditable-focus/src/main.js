import { schema as baseSchema } from 'prosemirror-schema-basic'
import { Schema } from 'prosemirror-model'
import { EditorState, TextSelection } from 'prosemirror-state'

import { setIntro, versions } from './shared.js'

setIntro(`
<p>Each editor has a node view with a <code>contentDOM</code> and a
<code>contenteditable=false</code> button next to it. The node view has no
<code>stopEvent</code>. The editor starts with the word "selected" selected, and is not focused.
Click the button. In 1.42.9 the editor stays unfocused and keeps its selection. In 1.43.0-beta1
the editor receives focus and the selection moves.</p>
`)

const schema = new Schema({
  nodes: baseSchema.spec.nodes.addBefore('paragraph', 'box', {
    group: 'block',
    content: 'block+',
    parseDOM: [{ tag: 'div[data-box]' }],
    toDOM: () => ['div', { 'data-box': '' }, 0],
  }),
  marks: baseSchema.spec.marks,
})

for (const { id, EditorView } of versions) {
  const logElement = document.querySelector(`#${id}-log`)
  const doc = schema.node('doc', null, [
    schema.node('box', null, [
      schema.node('paragraph', null, [schema.text('selected')]),
      schema.node('paragraph', null, [schema.text('target')]),
    ]),
  ])
  let view
  const describe = () => {
    const { from, to } = view.state.selection
    return `editor focused: ${view.hasFocus()} | selection: ${from}-${to} ${JSON.stringify(view.state.doc.textBetween(from, to))}`
  }
  view = new EditorView(document.querySelector(`#${id}`), {
    state: EditorState.create({ doc, selection: TextSelection.create(doc, 2, 10) }),
    nodeViews: {
      box: () => {
        const dom = document.createElement('div')
        const button = document.createElement('button')
        button.contentEditable = 'false'
        button.textContent = 'Non-editable button'
        button.addEventListener('click', () => {
          setTimeout(() => {
            logElement.textContent += `after click | ${describe()}\n`
          }, 100)
        })
        const contentDOM = document.createElement('div')
        dom.append(button, contentDOM)
        return { dom, contentDOM }
      },
    },
  })
  logElement.textContent = `initial | ${describe()}\n`
}
