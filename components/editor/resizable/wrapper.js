import React from "react"

import { useSetRefs } from "@availabs/avl-components"

import throttle from "lodash.throttle"

import { combineCompProps } from "../utils"

export default store =>
  Component =>
    React.forwardRef(({ compProps = {}, ...props }, ref) => {
      const {
        block, contentState, blockProps = {}
      } = props;

      const {
        adjustWidth,
        width = null
      } = blockProps

      const compRef = React.useRef(),
        [hovering, setHovering] = React.useState(false),
        [canResize, setCanResize] = React.useState(0);

      const [resizing, setResizing] = React.useState(0),
        [screenX, setScreenX] = React.useState(0);

      const _onResize = React.useCallback(e => {
          e.preventDefault();
          if (compRef.current && resizing) {
            const compRect = compRef.current.getBoundingClientRect(),
              diff = screenX - e.screenX,
              width = compRect.width - diff * resizing;
            setScreenX(e.screenX);
            adjustWidth(block, contentState, width);
          }
        }, [compRef, resizing, screenX, adjustWidth, block, contentState]),

        onResize = React.useMemo(() => throttle(_onResize, 25), [_onResize]),

        onMouseUp = React.useCallback(e => {
          setResizing(0);
        }, []);

      React.useEffect(() => {
        document.addEventListener("mousemove", onResize);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
          document.removeEventListener("mousemove", onResize);
          document.removeEventListener("mouseup", onMouseUp);
        }
      }, [onResize, onMouseUp]);

      const onMouseMove = React.useCallback(e => {
        setHovering(true);
        if (compRef.current) {
          const compRect = compRef.current.getBoundingClientRect();
          if ((e.clientX >= compRect.x) && (e.clientX <= (compRect.x + 20))) {
            setCanResize(-1);
          }
          else if ((e.clientX >= (compRect.x + compRect.width - 20)) && (e.clientX <= (compRect.x + compRect.width))) {
            setCanResize(1);
          }
          else {
            setCanResize(0);
          }
        }
      }, [compRef]);

      const onMouseDown = React.useCallback(e => {
        if (canResize) {
          e.preventDefault();
          setResizing(canResize);
          setScreenX(e.screenX);
        }
      }, [canResize]);

      const newCompProps = combineCompProps(
        compProps,
        { style: {
            width: width ? `${ width }px` : null,
            cursor: canResize ? "ew-resize" : "auto",
            boxShadow: hovering || resizing ?
              "0 0 2px 4px rgba(0, 0, 0, 0.25)" : ""
          },
          onMouseDown
        }
      );

      return (
        <figure className="relative" key={ blockProps.key }
          onMouseMove={ store.getReadOnly() ? null : onMouseMove }
          onMouseOut={ e => setHovering(false) }>

          <Component ref={ useSetRefs(ref, compRef) }
            compProps={ newCompProps } { ...props }/>

        </figure>
      )
    })
