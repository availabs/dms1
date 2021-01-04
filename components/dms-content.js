import React from "react"

export default ({ className="mt-20 flex-1 w-full mx-auto max-w-7xl mb-10", children }) =>
  <div className="flex">
    <div className={ className }>
      { children }
    </div>
  </div>
