import React from "react"

import { useTheme } from "modules/avl-components/src"

const DmsCard = ({ title, body, footer, children }) => {
  const theme = useTheme();
  return (
    <div className="grid grid-cols-1 gap-y-4">
      { !title ? null :
        <div className={ `text-3xl font-bold` }>
          { title }
          <div className="border-2 rounded"/>
        </div>
      }
      { !body ? null :
        <div className={ `${ theme.accent1 } rounded px-8 py-4 shadow-lg` }>
          { body }
        </div>
      }
      { children }
      { !footer ? null :
        <div className={ `rounded py-2 px-4 ${ theme.accent1 } shadow-lg` }>{ footer }</div>
      }
    </div>
  )
}
export default DmsCard;
