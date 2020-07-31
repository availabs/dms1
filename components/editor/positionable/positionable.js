import React from "react"

const POSITIONS = ["flex", "flex float-left mr-2", "flex flex-row justify-center", "flex float-right ml-2"]

const BUTTONS = [
  <svg viewBox="0 0 24 24"
    height="24" width="24"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M3,21 L21,21 L21,19 L3,19 L3,21 Z M3,3 L3,5 L21,5 L21,3 L3,3 Z M3,7 L3,17 L17,17 L17,7 L3,7 Z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>,
  <svg viewBox="0 0 24 24"
    height="24" width="24"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M21,15 L15,15 L15,17 L21,17 L21,15 Z M21,7 L15,7 L15,9 L21,9 L21,7 Z M15,13 L21,13 L21,11 L15,11 L15,13 Z M3,21 L21,21 L21,19 L3,19 L3,21 Z M3,3 L3,5 L21,5 L21,3 L3,3 Z M3,7 L3,17 L13,17 L13,7 L3,7 Z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>,
  <svg viewBox="0 0 24 24"
    height="24" width="24"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M3,21 L21,21 L21,19 L3,19 L3,21 Z M3,3 L3,5 L21,5 L21,3 L3,3 Z M5,7 L5,17 L19,17 L19,7 L5,7 Z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>,
  <svg viewBox="0 0 24 24"
    height="24" width="24"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M9,15 L3,15 L3,17 L9,17 L9,15 Z M9,7 L3,7 L3,9 L9,9 L9,7 Z M3,13 L9,13 L9,11 L3,11 L3,13 Z M3,21 L21,21 L21,19 L3,19 L3,21 Z M3,3 L3,5 L21,5 L21,3 L3,3 Z M11,7 L11,17 L21,17 L21,7 L11,7 Z" />
    <path d="M0 0h24v24H0z" fill="none" />
  </svg>
]

export default store =>
  Component =>
    ({ ...props }) => {
      const {
        block, contentState, blockProps = {}
      } = props;
      const {
        adjustPosition,
        position,
        hoverPosition = ""
      } = blockProps;
      const handleClick = (e, p) => {
        e.preventDefault();
        adjustPosition(block, contentState, p);
      }
      return (
        <div className={ `${ POSITIONS[position] } relative z-10 my-2` }
          onDrop={ e => e.preventDefault() }>
          <div className={ `
            inline-block relative pointer-events-auto hoverable
          ` }>
            <div className={ `
              absolute ${ store.getReadOnly() ? "hidden" : "show-on-hover" }
              top-0 ${ hoverPosition } p-1 w-full
            ` }>
              <div className="w-full flex justify-center">
                { BUTTONS.map((b, i) =>
                    <button className={ `
                        py-1 px-2 bg-gray-100 hover:bg-gray-300
                        ${ position === i ? "bg-gray-300" : "" }
                      ` }
                      onClick={ e => handleClick(e, i) } key={ i }
                      onMouseDown={ e => e.preventDefault() }>
                      { BUTTONS[i] }
                    </button>
                  )
                }
              </div>
            </div>

            <Component { ...props }/>
          </div>
        </div>
      )
    }
