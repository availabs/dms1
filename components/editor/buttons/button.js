import React from "react"

import { useTheme } from "@availabs/avl-components"

export default ({ active, disabled, children, ...props }) => {
  const theme = useTheme();
  return (
    <button { ...props } disabled={ disabled } tabIndex={ -1 }
      onMouseDown={ e => e.preventDefault() }
      className={ `px-1 first:rounded-l last:rounded-r focus:border-none focus:outline-none
        ${ active ? `${ theme.menuBgActive } ${ theme.menuBgActiveHover }` : theme.menuBg }
        ${ active ? `${ theme.menuTextActive } ${ theme.menuTextActiveHover }` : theme.menuText }
        ${ disabled ? "bg-red-300 cursor-not-allowed" :
            `${ theme.menuBgHover } ${ theme.menuTextHover } cursor-pointer`
        }
      ` }>
      { children }
    </button>
  )
}
