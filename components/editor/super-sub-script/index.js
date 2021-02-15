import React from "react"

const makeStrategy = script =>
  (contentBlock, callback, contentState) => {
    const characterList = contentBlock.getCharacterList();
    let start = null;
    characterList.forEach((c, i) => {
      const hasStyle = c.hasStyle(script);
      if (hasStyle && (start === null)) {
        start = i;
      }
      else if (!hasStyle) {
        if (start !== null) {
          callback(start, i);
        }
        start = null;
      }
    })
    if (start !== null) {
      callback(start, characterList.size);
    }
  }

const SuperSubScriptPlugin = () => ({
  decorators: [
    { strategy: makeStrategy("SUPERSCRIPT"),
      component: props => <sup>{ props.children }</sup>
    },
    { strategy: makeStrategy("SUBSCRIPT"),
      component: props => <sub>{ props.children }</sub>
    }
  ]
})
export default SuperSubScriptPlugin
