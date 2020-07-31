import React from "react"

import { Modifier, EditorState } from 'draft-js';

import Button from "./button"
import ICONS from "./icons"

export default (dataType, buttonType, store, shift, max, min = 0) =>
  () => {
    const {
      getEditorState,
      setEditorState
    } = store;
    const editorState = getEditorState();

    const getStartData = contentState =>
      contentState
        .getBlockForKey(editorState.getSelection().getStartKey())
        .getData()

    const isActive = () => {
      if (shift > 0) return false;
      const data = getStartData(editorState.getCurrentContent());
      return data.get(dataType) > min;
    }

    const click = e => {
      e.preventDefault();
      const contentState = editorState.getCurrentContent(),
        selectionState = editorState.getSelection(),
        blockData = getStartData(contentState);

      let value = blockData.get(dataType) || min;
      value = Math.max(min, Math.min(max, value + shift));

      const newContentState = Modifier.setBlockData(
        contentState,
        selectionState,
        value > min ? blockData.set(dataType, value) : blockData.delete(dataType)
      );

      setEditorState(
        EditorState.set(
          editorState,
          { currentContent: newContentState }
        )
      );
    }

    return (
      <Button active={ isActive() } onClick={ click }>
        { ICONS[buttonType] }
      </Button>
    )
  }
