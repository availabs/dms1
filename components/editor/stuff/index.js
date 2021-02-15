import React from "react"
import { EditorState, DefaultDraftBlockRenderMap, getDefaultKeyBinding } from "draft-js"

import Immutable from "immutable"

const customStyleMap = {
  'STRIKETHROUGH': {
    textDecoration: 'line-through',
  }
};

const blockStyleFn = block => {
  const textAlign = block.getData().get("textAlign"),
    textIndent = block.getData().get("textIndent");

  const styles = [
    textIndent ? `indent-${ textIndent }` : "",
    textAlign || ""
  ]

  const type = block.getType();
  switch (type) {
    case "header-one":
      styles.push("text-3xl font-extrabold");
      break;
    case "header-two":
      styles.push("text-2xl font-bold");
      break;
    case "header-three":
      styles.push("text-xl font-semibold");
      break;
    case "header-four":
      styles.push("text-base font-medium");
      break;
    case "header-five":
      styles.push("text-sm font-medium");
      break;
    case "header-six":
      styles.push("text-xs font-medium");
      break;
    case "blockquote":
      styles.push("rounded bg-gray-200 py-2 px-3 m-2");
      break;
    default:
      break;
  }
  return styles.filter(Boolean).join(" ");
}

const myBlockRenderMap = Immutable.Map({
  "blockquote": {
    element: "blockquote",
    wrapper: <div className="rounded bg-gray-100 p-2 my-2"/>
  },
  "code-block": {
    element: "pre",
    wrapper: <pre className="border font-mono py-2 px-3 rounded bg-gray-50 my-2"/>
  },
  "atomic": {
    element: "figure",
    wrapper: <figure className="relative z-10"/>
  }
})
const blockRenderMap = DefaultDraftBlockRenderMap.merge(myBlockRenderMap);

const hasListSelected = editorState =>
  editorState.getCurrentContent()
    .getBlockForKey(editorState.getSelection().getStartKey())
    .getType().includes("ordered-list-item");

const onTab = (store, e) => {

  if (!((+e.keyCode === 9) || (+e.code === 0x000f))) return getDefaultKeyBinding(e);
  if (!hasListSelected(store.getEditorState())) return getDefaultKeyBinding(e);
  e.preventDefault();

  let found = false;
  const direction = e.shiftKey ? -1 : 1,

    editorState = store.getEditorState(),

    contentState = editorState.getCurrentContent(),
    blockMap = contentState.getBlockMap(),

    selection = editorState.getSelection(),
    startKey = selection.getStartKey(),
    endKey = selection.getEndKey(),

    newBlockMap = blockMap.reduce((a, block) => {
      const depth = block.getDepth(),
        key = block.getKey();
      if (key === startKey) {
        found = true;
      }
      if (found) {
        block = block.set("depth", Math.max(0, Math.min(4, depth + direction)));
      }
      if (key === endKey) {
        found = false;
      }
      return a.set(block.getKey(), block);
    }, blockMap);

  store.setEditorState(
    EditorState.forceSelection(
      EditorState.push(
        editorState,
        contentState.merge({ blockMap: newBlockMap }),
        'adjust-depth'
      ),
      selection
    )
  );
}

const StuffPlugin = () => {
  const store = {};

  return {
    initialize: ({ getEditorState, setEditorState, ...rest }) => {
      store.getEditorState = getEditorState;
      store.setEditorState = setEditorState;
    },
    keyBindingFn: onTab.bind(null, store),
    customStyleMap,
    blockStyleFn,
    blockRenderMap
  }
}
export default StuffPlugin
