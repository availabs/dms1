import React from "react"

import { useSetRefs } from "@availabs/avl-components"

import throttle from "lodash.throttle"

import { combineCompProps } from "../utils"

const POSITIONS = ["block", "inline-block float-left mr-2", "block mx-auto", "inline-block float-right ml-2"]

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
    React.forwardRef(({ compProps = {}, ...props }, ref) => {
      const {
        block, contentState, blockProps = {}
      } = props;
      const {
        adjustPosition,
        position
      } = blockProps;

      const handleClick = (e, p) => {
        e.preventDefault();
        if (p !== position) {
          adjustPosition(block, contentState, p);
          setDisplay("none");
        }
      }

      const figRef = React.useRef(),
        compRef = React.useRef(),
        [display, setDisplay] = React.useState("none"),
        [pos, setPos] = React.useState([0, 0]);

      const _onMouseMove = React.useCallback(e => {
          setDisplay("flex");
          if (compRef.current) {
            const figRect = figRef.current.getBoundingClientRect(),
              compRect = compRef.current.getBoundingClientRect();
            setPos([
              (compRect.x - figRect.x), compRect.width
            ]);
          }
        }, [figRef, compRef]),
        onMouseMove = React.useMemo(() => throttle(_onMouseMove, 25), [_onMouseMove]);

      const newCompProps = combineCompProps(
        compProps,
        { className: POSITIONS[position] }
      )

      return (
        <figure ref={ figRef } className="relative" key={ blockProps.key }
          onMouseMove={ onMouseMove }
          onMouseOut={ e => { setDisplay("none"); onMouseMove.cancel() } }>

          <div className={ `absolute top-0 p-1 z-10 justify-center` }
            style={ {
              display: store.getReadOnly() ? "none" : display,
              left: `${ pos[0] }px`, width: `${ pos[1] }px`
            } }>
            { BUTTONS.map((b, i) =>
                <button className={ `
                    py-1 px-2 bg-gray-100 hover:bg-gray-300
                    ${ position === i ? "bg-gray-300" : "" }
                  ` }
                  onClick={ e => handleClick(e, i) } key={ i }
                  onMouseDown={ e => e.preventDefault() }>
                  { b }
                </button>
              )
            }
          </div>

          <Component ref={ useSetRefs(ref, compRef) }
            compProps={ newCompProps } { ...props }/>

        </figure>
      )
    })
