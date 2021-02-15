import React from "react"

import { Modifier, EditorState } from 'draft-js';

import Button from "./button"
import ICONS from "./icons"

const makeBlockDataButton = (dataType, buttonType, store) =>
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
      const data = getStartData(editorState.getCurrentContent());
      return data.get(dataType) === buttonType;
    }

    const click = e => {
      e.preventDefault();
      const contentState = editorState.getCurrentContent(),
        selectionState = editorState.getSelection(),
        blockData = getStartData(contentState),

        newContentState = Modifier.setBlockData(
          contentState,
          selectionState,
          isActive() ? blockData.delete(dataType) : blockData.set(dataType, buttonType)
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
export default makeBlockDataButton;
