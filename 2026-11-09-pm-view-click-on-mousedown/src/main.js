import { Plugin } from 'prosemirror-state'

import { createEditor, describeSelection, setIntro, versions } from './shared.js'

setIntro(`
<p>The plugin's <code>handleClick</code> returns <code>true</code> when the click lands on a link
(like an editor that opens links on click). Try:</p>
<ol>
  <li>Click the link. 1.42.9 calls <code>handleClick</code> after <code>mouseup</code>.
  1.43.0-beta1 calls it on <code>mousedown</code>, and the caret does not move into the link.</li>
  <li>Press the mouse on the link text and drag to the end of the paragraph. 1.42.9 selects the
  text. 1.43.0-beta1 calls <code>handleClick</code> and creates no selection.</li>
</ol>
`)

for (const version of versions) {
  let pressed = false
  const plugin = new Plugin({
    props: {
      handleClick: (view, pos, event) => {
        if (!event.target.closest('a')) return false
        log(`handleClick at pos ${pos}, ${pressed ? 'before mouseup' : 'after mouseup'}`)
        return true
      },
    },
  })
  const { view, log } = createEditor(version, '<p>Read <a href="https://example.com">this link here</a> and keep on writing to the end.</p>', { plugins: [plugin] })
  view.dom.addEventListener('mousedown', () => { pressed = true }, true)
  view.dom.ownerDocument.addEventListener('mouseup', () => {
    if (!pressed) return
    pressed = false
    setTimeout(() => log(`mouseup | ${describeSelection(view)}`), 100)
  })
  view.dom.addEventListener('click', (event) => event.preventDefault())
}
