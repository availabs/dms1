import React from "react"

import { useTheme } from "@availabs/avl-components"

const Separator = ({ ...props }) =>
  <div className="border-r border-l mx-2 border-current" style={ { borderColor: "currentColor" } }/>

export default (options = {}) => {
  const {
    position = "top",
    direction = "row"
  } = options;

  const store = {};

  const Toolbar = ({ children }) => {
    const theme = useTheme();
    return (
      <div className={ `absolute ${ position }-0 left-0 w-full p-2 z-10 h-14` }>
        <div className={ `flex flex-${ direction } shadow-md h-10 p-1 rounded ${ theme.menuBg } w-full` }>
          { children }
        </div>
      </div>
    )
  }

  return {
    initialize: ({ getEditorState, setEditorState, getProps }) => {
      store.getEditorState = getEditorState;
      store.setEditorState = setEditorState;
    },
    Toolbar,
    Separator
  }
}
