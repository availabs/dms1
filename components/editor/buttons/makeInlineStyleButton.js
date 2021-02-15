import React from "react"

import { RichUtils } from 'draft-js';

import Button from "./button"
import ICONS from "./icons"

const makeInlineStyleButton = (buttonType, store) =>
  () => {
    const {
      getEditorState,
      setEditorState
    } = store;
    const editorState = getEditorState();
    const click = e => {
      e.preventDefault();
      setEditorState(
        RichUtils.toggleInlineStyle(editorState, buttonType)
      );
    }
    const isActive = () =>
      editorState
        .getCurrentInlineStyle()
        .has(buttonType)

    return (
      <Button active={ isActive() } onClick={ click }>
        { ICONS[buttonType] }
      </Button>
    )
  }
export default makeInlineStyleButton;
