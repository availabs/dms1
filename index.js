import React from "react"

import DmsComponents from "./components"

import { DmsButton } from "./components/dms-button"

import { HeaderComponent } from "@availabs/avl-components"

import dmsManager from "./wrappers/dms-manager"

// import "./styles.css"

const DmsManager = ({ showHome = true, stack, top = {}, noHeader = false, className = null, ...props }) => {
  if (!props.format) {
    return <NoFormat />
  }

  const { dmsAction } = top, actions = [];

  if ((stack.length > 1) && showHome) {
     actions.push({
       Comp: DmsButton,
       action: "dms:home"
     })
  }
  if (stack.length > 1) {
    actions.push({
      Comp: DmsButton,
      action: "dms:back"
    })
  }
  if (dmsAction === "list") {
    actions.push({
      Comp: DmsButton,
      action: "dms:create"
    })
  }

  return (
    <div className={ className }>
      { noHeader ? null :
        <HeaderComponent title={ props.title || `${ props.app } Manager` }>
          { actions.map(({ Comp, action }) =>
              <Comp className="ml-2" key={ action } action={ action }/>
            )
          }
        </HeaderComponent>
      }
      { props.children }
    </div>
  )
}
const NoFormat = () => <div large className="p-5">No format supplied!!!</div>;

export default {
  ...DmsComponents,
  "dms-manager": dmsManager(DmsManager)
}
