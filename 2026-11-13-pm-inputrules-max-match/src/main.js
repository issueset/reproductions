import 'prosemirror-view/style/prosemirror.css'
import './style.css'
import { baseKeymap } from 'prosemirror-commands'
import { history, redo, undo } from 'prosemirror-history'
import { inputRules, textblockTypeInputRule, wrappingInputRule } from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import { schema } from 'prosemirror-schema-basic'
import { EditorState, TextSelection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

const MAX_MATCH = 500

// Returns `prefix + marker + filler` where `marker` starts exactly
// MAX_MATCH characters before the end, so the input rule window starts at it.
function buildText(prefix, marker, fillerChar) {
  const fillerLength = MAX_MATCH - marker.length
  return prefix + marker + fillerChar.repeat(Math.ceil(fillerLength / fillerChar.length)).slice(0, fillerLength)
}

// Describes the document structure, e.g. `blockquote(paragraph(502 chars))`.
function describe(node) {
  if (node.isText) return null
  if (node.isTextblock) return `${node.type.name}(${node.textContent.length} chars, ends with ${JSON.stringify(node.textContent.slice(-6))})`
  const children = []
  node.forEach((child) => children.push(describe(child)))
  return `${node.type.name}(${children.filter(Boolean).join(', ')})`
}

function setup({ id, rule, text }) {
  const logElement = document.querySelector(`#${id}-log`)
  const plugins = [
    inputRules({ rules: [rule] }),
    history(),
    keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }),
    keymap(baseKeymap),
  ]
  const createState = () => {
    const doc = schema.node('doc', null, [schema.node('paragraph', null, [schema.text(text)])])
    const state = EditorState.create({ doc, plugins })
    return state.apply(state.tr.setSelection(TextSelection.atEnd(state.doc)))
  }
  let lines = []
  const log = (line) => {
    lines.push(line)
    logElement.textContent = lines.join('\n')
  }
  const view = new EditorView(document.querySelector(`#${id}`), {
    state: createState(),
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr))
      if (tr.docChanged) log(describe(view.state.doc))
    },
  })
  const reset = () => {
    view.updateState(createState())
    lines = []
    log(`initial: ${describe(view.state.doc)}`)
    view.focus()
  }
  document.querySelector(`#${id}-reset`).addEventListener('click', reset)
  reset()
}

setup({
  id: 'blockquote',
  rule: wrappingInputRule(/^>\s/, schema.nodes.blockquote),
  text: buildText('Reply: a ', '> ', 'lorem ipsum dolor sit amet '),
})

setup({
  id: 'code-block',
  rule: textblockTypeInputRule(/^```(\S*)\s$/, schema.nodes.code_block),
  text: buildText('Image: ', '```', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'),
})
