import React from "react"

import { useTheme } from "@availabs/avl-components"

const DmsCard = ({ title, body, footer, children }) => {
  const theme = useTheme();
  return (
    <div>
      { !title ? null :
        <div className={ `${ theme.contentBg } rounded px-4 py-2 mb-3 shadow text-3xl font-bold` }>
          { title }
        </div>
      }
      { !body ? null :
        <div className={ `${ theme.contentBg } rounded px-8 py-4 mb-3 shadow` }>
          { body }
        </div>
      }
      { children }
      { !footer ? null :
        <div className={ `rounded py-2 px-4 ${ theme.contentBg } shadow` }>{ footer }</div>
      }
    </div>
  )
}
export default DmsCard;
