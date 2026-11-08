import 'pv-beta/style/prosemirror.css'
import './style.css'
import { DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { EditorState } from 'prosemirror-state'
import * as viewOld from 'pv-old'
import * as viewBeta from 'pv-beta'

export const versions = [
  { id: 'old', EditorView: viewOld.EditorView },
  { id: 'beta', EditorView: viewBeta.EditorView },
]

export function setIntro(html) {
  document.querySelector('#intro').innerHTML = html
}

export function createEditor({ id, EditorView }, html, props = {}) {
  const container = document.createElement('div')
  container.innerHTML = html
  const doc = DOMParser.fromSchema(schema).parse(container)
  const logElement = document.querySelector(`#${id}-log`)
  const log = (line) => {
    logElement.textContent += `${line}\n`
  }
  const view = new EditorView(document.querySelector(`#${id}`), {
    state: EditorState.create({ doc, plugins: props.plugins ?? [] }),
    ...props,
  })
  return { view, log, logElement }
}

export function describeSelection(view) {
  const selection = view.state.selection
  const dom = view.dom.ownerDocument.getSelection()
  const domText = dom && dom.focusNode ? `${JSON.stringify((dom.focusNode.textContent ?? '').slice(0, 16))}@${dom.focusOffset}` : 'none'
  return `state: ${selection.toJSON().type} ${selection.from}-${selection.to} | DOM focus: ${domText}`
}
