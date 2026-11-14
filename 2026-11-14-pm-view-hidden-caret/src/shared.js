import 'pv-beta/style/prosemirror.css'
import './style.css'
import * as viewOld from 'pv-old'
import * as viewBeta from 'pv-beta'

export const versions = [
  { id: 'old', EditorView: viewOld.EditorView },
  { id: 'beta', EditorView: viewBeta.EditorView },
]

export function setIntro(html) {
  document.querySelector('#intro').innerHTML = html
}
