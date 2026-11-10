import "pv-beta/style/prosemirror.css";
import "./style.css";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import * as viewOld from "pv-old";
import * as viewBeta from "pv-beta";

document.querySelector("#intro").innerHTML = `
<p>Each editor has four draggable blocks in a scroll container. The button replays the events of
Playwright's <code>dragAndDrop</code> from A to the top of C: <code>mousedown</code> on A, one <code>mousemove</code>
to C, then <code>dragstart</code> and <code>drop</code>. In 1.42.9 the result is B, A, C, D. In 1.43.0-beta2 the
<code>mousemove</code> selects C and scrolls it into view, so <code>dragstart</code> drags B instead of A.</p>
`;

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    text: {},
    block: {
      group: "block",
      draggable: true,
      attrs: { label: { default: "" }, color: { default: "#888" } },
      toDOM: (node) => [
        "div",
        { class: "block", style: `background: ${node.attrs.color}` },
        node.attrs.label,
      ],
    },
  },
});

const blocks = [
  ["A", "#d4a017"],
  ["B", "#2e8b57"],
  ["C", "#1e6fd9"],
  ["D", "#c0392b"],
];

for (const [id, { EditorView }] of [
  ["old", viewOld],
  ["beta", viewBeta],
]) {
  const doc = schema.node(
    "doc",
    null,
    blocks.map(([label, color]) => schema.nodes.block.create({ label, color })),
  );
  const view = new EditorView(document.querySelector(`#${id}`), {
    state: EditorState.create({ doc }),
  });
  const logElement = document.querySelector(`#${id}-log`);
  const scroller = view.dom.closest(".scroller");
  const order = () => {
    const a = [];
    view.state.doc.forEach((n) => a.push(n.attrs.label));
    return a.join(", ");
  };
  logElement.textContent = `order: ${order()}`;

  document.querySelector(`#${id}-run`).addEventListener("click", async () => {
    scroller.scrollTop = 0;
    // Focus the editor first, and wait for `selectionchange`, as after a real click.
    view.focus();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const [a, , c] = view.dom.children;
    const ra = a.getBoundingClientRect(),
      rc = c.getBoundingClientRect();
    const start = {
      clientX: ra.left + ra.width / 2,
      clientY: ra.top + ra.height / 2,
    };
    const end = { clientX: rc.left + 5, clientY: rc.top + 5 };
    const lines = [`order before: ${order()}`];
    const mouse = (type, target, point) =>
      target.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          ...point,
        }),
      );
    const drag = (type, target, point, dataTransfer) =>
      target.dispatchEvent(
        new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          ...point,
        }),
      );

    mouse("mousedown", a, start);
    mouse("mousemove", c, end);
    lines.push(
      `after mousemove: scrollTop=${scroller.scrollTop}, selection=${view.state.selection.toJSON().type} ${view.state.selection.from}`,
    );
    // The browser fires dragstart at the mousedown point, on whatever element is there now.
    const source = document.elementFromPoint(start.clientX, start.clientY);
    lines.push(`dragstart target: ${source.textContent}`);
    const dataTransfer = new DataTransfer();
    drag("dragstart", source, start, dataTransfer);
    const target = document.elementFromPoint(end.clientX, end.clientY);
    drag("dragover", target, end, dataTransfer);
    drag("drop", target, end, dataTransfer);
    drag("dragend", source, end, dataTransfer);
    mouse("mouseup", target, end);
    lines.push(`order after: ${order()}`);
    logElement.textContent = lines.join("\n");
  });
}
