import React from "react"

import { UserMenu, UserMenuItem } from "components/avl-components/components/HeaderBar/UserMenu"
import { useTheme } from "components/avl-components/wrappers/with-theme"
import { useDms } from "../contexts/dms-context"
import { useMessenger } from "../contexts/messenger-context"

import { DmsButton } from "./dms-button"

export default ({ title, showHome = true, dmsActions = [], ...props }) => {
  const { stack, top, item } = useDms(),
    { pageMessages, attributeMessages } = useMessenger();

  if (stack.length > 1) {
    dmsActions.unshift({
      action: "dms:back",
      // showConfirm: Boolean(pageMessages.length)
    });
  }
  if ((stack.length > 1) && showHome) {
     dmsActions.unshift({
       action: "dms:home",
       // showConfirm: Boolean(pageMessages.length)
     });
  }
  if (top.dmsAction === "list") {
    dmsActions.unshift({ action: "dms:create" });
  }
  const theme = useTheme();

  return (
    <div className={ `fixed top-0 left-0 right-0 z-50 flex items-center px-8 md:ml-${ theme.sidebarW } ${ theme.headerBg } ` }
      style={ { boxShadow: "0px 6px 3px -3px rgba(0, 0, 0, 0.25)" } }>
      <div className="flex-1 text-4xl font-bold">
        { title || `${ props.app } Manager` }
      </div>
      <div className="flex-0 flex items-center">
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
        <div className="ml-8">
          <UserMenu>
            <UserMenuItem>
              Profile
            </UserMenuItem>
            <UserMenuItem>
              Settings
            </UserMenuItem>
            <UserMenuItem to="logout">
              Logout
            </UserMenuItem>
          </UserMenu>
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
              <div key={ id } className={ `my-1 whitespace-no-wrap rounded ${ theme.text }` }>
                { msg }
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
