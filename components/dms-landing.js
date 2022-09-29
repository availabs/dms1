import React from "react"


import { useTheme } from "@availabs/avl-components"

const DmsLanding = (props) => {
  const theme = useTheme();

  return (
    <div className={ `
        w-full border-2 border-transparent rounded p-2 ${ theme.transition }
      `}>
        { props.dataItems.map(d => (
                <div className={'p-5'}>
                    {
                        props.children.map(c => React.cloneElement(c, { ...props, ...{'blog-post': d, children: []} })) // how to pass "item" to this?
                    }
                </div>
            )
        )}
    </div>
  )
}

export default DmsLanding;
