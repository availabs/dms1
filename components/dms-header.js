import React from "react"

import { useTheme, HeaderComponent } from "@availabs/avl-components"
import { useDms } from "../contexts/dms-context"

import { DmsButton } from "./dms-button"
import { useMessenger } from "../contexts/messenger-context"

const Title = ({ children }) => {
  return (
    <div className="container mx-auto">
      { children }
    </div>
  )
}

const DmsHeader = ({ title, shadowed = true, showHome = true, dmsActions = [], navBarSide = true, userMenu = false, ...props }) => {
  const { stack, top, item } = useDms(),
    { pageMessages, attributeMessages } = useMessenger();

  if (stack.length > 1) {
    dmsActions = [
      { action: "dms:back" },
      ...dmsActions
    ];
  }
  if ((stack.length > 1) && showHome) {
    dmsActions = [
      { action: "dms:home" },
      ...dmsActions
    ];
  }
  if (top.dmsAction === "list") {
    dmsActions = [
      { action: "dms:create" },
      ...dmsActions
    ];
  }
  const theme = useTheme();

  return (
    <div className={ `
        fixed top-0 left-0 right-0 z-50 ${ theme.menuBg }
        ${ navBarSide ? `md:ml-${ theme.sidebarW }` : '' }
        ${ theme.menuBg }
      ` }>
      <div>
        
          <div className="flex items-center justify-between w-full bg-gray-100 border-b border-gray-200">
            <div className='text-lg p-2'>
            {title}
            </div>
            <div className='px-4 flex items-center'> 
              <div>
                { !pageMessages.length ? null :
                  <Warning warnings={ pageMessages }/>
                }
                { !attributeMessages.length ? null :
                  <Warning warnings={ attributeMessages } type="att"/>
                }
                { dmsActions.map(a =>
                    <DmsButton className="ml-1" key={ a.action || a } action={ a } item={ item }/>
                  )
                }
              </div>
              <div>
                {props.children}
              </div>
            </div>
          </div>
        
      </div>
    </div>
  )
}
const Warning = ({ warnings, type = "page" }) => {
  const theme = useTheme();
  return (
    <div className={ `
      ${ type === "att" ? theme.textDanger : theme.textInfo } ${ theme.transition }
      flex items-center rounded cursor-pointer
      relative hoverable ml-1
    ` }>
      <span className="fas fa-2x fa-exclamation-triangle"/>
      <div className={ `
        show-on-hover show-on-bottom pt-1 bg-transparent
        absolute right-0 cursor-default
      ` }>
        <div className={ `
          px-4 py-1 rounded shadow ${ theme.accent2 } ${ theme.text }
        ` }>
          { warnings.map(({ id, msg }) =>
              <div key={ id } className={ `my-1 whitespace-nowrap rounded ${ theme.text }` }>
                { msg }
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
export default DmsHeader;
