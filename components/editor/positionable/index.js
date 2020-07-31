//import React from "react"

import { EditorState } from 'draft-js';

import makePositionable from "./positionable"

export default () => {
  const store = {};

  const adjustPosition = (block, contentState, position) => {
    const entityKey = block.getEntityAt(0),
      editorState = store.getEditorState();
    contentState.mergeEntityData(entityKey, { position });
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
    },
    blockRendererFn: (block, { getEditorState }) => {
      if (block.getType() === "atomic") {
        const contentState = getEditorState().getCurrentContent(),
          entityKey = block.getEntityAt(0);

        if (!entityKey) return null;

        const { position = 0 } = contentState.getEntity(entityKey).getData();

        return {
          props: {
            adjustPosition,
            position
          }
        };
      }
      return null;
    },
    positionable: makePositionable(store)
  }
}
