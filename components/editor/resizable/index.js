import { EditorState } from 'draft-js';

import makeWrapper from "./wrapper"

const ResizablePlugin = () => {
  const store = {};

  const adjustWidth = (block, contentState, width) => {
    const entityKey = block.getEntityAt(0),
      editorState = store.getEditorState();
    contentState.mergeEntityData(entityKey, { width });
    store.setEditorState(
      EditorState.forceSelection(
        editorState,
        editorState.getSelection()
      )
    )
  }

  return {
    initialize: ({ getEditorState, setEditorState, getReadOnly }) => {
      store.getEditorState = getEditorState;
      store.setEditorState = setEditorState;
      store.getReadOnly = getReadOnly;

      store.resizing = 0;
      store.screenX = null;
    },
    blockRendererFn: (block, { getEditorState }) => {
      if (block.getType() === "atomic") {
        const contentState = getEditorState().getCurrentContent(),
          entityKey = block.getEntityAt(0);

        if (!entityKey) return null;

        const { width = null } = contentState.getEntity(entityKey).getData();

        return {
          props: {
            adjustWidth,
            width,
            key: entityKey
          }
        };
      }
      return null;
    },
    wrapper: makeWrapper(store)
  }
}
export default ResizablePlugin
