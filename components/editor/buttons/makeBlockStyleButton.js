import React from "react"

import { RichUtils } from 'draft-js';

import Button from "./button"
import ICONS from "./icons"

const makeBlockStyleButton = (buttonType, store) =>
  () => {
    const {
      getEditorState,
      setEditorState
    } = store;
    const editorState = getEditorState();
    const click = e => {
      e.preventDefault();
      setEditorState(
        RichUtils.toggleBlockType(editorState, buttonType)
      );
    }
    const isActive = () =>
      editorState
        .getCurrentContent()
        .getBlockForKey(editorState.getSelection().getStartKey())
        .getType() === buttonType;

    return (
      <Button active={ isActive() }
        onClick={ click }>
        { ICONS[buttonType] }
      </Button>
    )
  }
export default makeBlockStyleButton;
