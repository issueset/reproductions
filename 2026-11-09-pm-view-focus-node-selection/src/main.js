import { NodeSelection } from 'prosemirror-state'

import { createEditor, describeSelection, setIntro, versions } from './shared.js'

setIntro(`
<p>Click the button under each editor. It calls <code>view.focus()</code> and then dispatches a
<code>NodeSelection</code> on the blockquote. In 1.42.9 the node selection stays. In
1.43.0-beta1 it reverts to a <code>TextSelection</code> shortly after, and the
<code>ProseMirror-selectednode</code> class is removed. Reproduces in Chrome and Safari.</p>
`)

for (const version of versions) {
  const { view, log, logElement } = createEditor(version, '<p>First paragraph.</p><blockquote><p>Quote.</p></blockquote>')
  const button = document.createElement('button')
  button.textContent = 'focus() + select blockquote node'
  button.addEventListener('click', () => {
    view.dom.ownerDocument.getSelection()?.removeAllRanges()
    view.dom.blur()
    logElement.textContent = ''
    const pos = view.state.doc.child(0).nodeSize
    view.focus()
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)))
    const hasClass = () => !!view.dom.querySelector('.ProseMirror-selectednode')
    log(`sync:   ${describeSelection(view)} | selectednode: ${hasClass()}`)
    setTimeout(() => log(`300 ms: ${describeSelection(view)} | selectednode: ${hasClass()}`), 300)
  })
  view.dom.parentElement.after(button)
}
