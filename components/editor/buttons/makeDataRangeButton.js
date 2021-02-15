import React from "react"

import { Modifier, EditorState } from 'draft-js';

import Button from "./button"
import ICONS from "./icons"

const makeDataRangeButton = (dataType, buttonType, store, shift, max, min = 0) =>
  () => {
    const {
      getEditorState,
      setEditorState
    } = store;
    const editorState = getEditorState();

    const getStartData = React.useCallback(contentState =>
      contentState
        .getBlockForKey(editorState.getSelection().getStartKey())
        .getData()
    , [editorState]);

    const isDisabled = React.useCallback(() => {
      const data = getStartData(editorState.getCurrentContent()),
        value = data.get(dataType) || 0;
      return (value + shift < min) || (value + shift > max);
    }, [getStartData, editorState]);

    const click = React.useCallback(e => {
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
    }, [getStartData, editorState, setEditorState]);

    return (
      <Button disabled={ isDisabled() } onClick={ click }>
        { ICONS[buttonType] }
      </Button>
    )
  }
export default makeDataRangeButton;
