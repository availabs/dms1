import React from "react"

import DmsHeader from "./dms-header"
import DmsContent from "./dms-content"

import dmsManager from "../wrappers/dms-manager"

const DmsManager = ({ showHeader = true, className, children, ...props }) => {
  if (!props.format) {
    return <NoFormat />
  }
  return (
    <DmsContent className={ className }>
      { !showHeader ? null :
        <DmsHeader { ...props }/>
      }
      <div className={ className }>
        { children }
      </div>
    </DmsContent>
  )
}
const WrappedDmsManager = dmsManager(DmsManager);

export default WrappedDmsManager;

const NoFormat = () =>
  <DmsContent className="pt-20 h-full w-full mx-auto max-w-7xl pb-10 grid place-content-center">
    <div className="font-bold text-2xl">No format supplied!!!</div>
  </DmsContent>
