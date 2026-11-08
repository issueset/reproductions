import { createEditor, describeSelection, setIntro, versions } from './shared.js'

setIntro(`
<p>Reload the page, then click once in the middle of the second paragraph of an editor (click
outside the editors to blur between tries). In 1.42.9 the caret lands where you clicked. In
1.43.0-beta1 on Safari, the state selection moves but the DOM caret stays at the old position
(offset 0). The log shows the state and DOM selection after each <code>mouseup</code>.</p>
`)

for (const version of versions) {
  const { view, log } = createEditor(version, '<p>Welcome to the editor.</p><p>Drop a line and keep on writing here.</p>')
  view.dom.addEventListener('mouseup', () => {
    setTimeout(() => log(`${view.hasFocus() ? 'focused' : 'blurred'} | ${describeSelection(view)}`), 300)
  })
}
