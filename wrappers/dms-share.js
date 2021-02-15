import React from "react"

import get from "lodash.get"

import { mapDataToProps as doMapDataToProps } from "../utils"

const dmsShare = (Component, options = {}) => {
  const {
    mapDataToProps = {},
    propsToShare = {}
  } = options;
  return ({ children, ...props }) => {
    let toShare = doMapDataToProps(mapDataToProps, { props });
    if (typeof propsToShare === "string") {
      const split = propsToShare.split(".");
      toShare[split.pop()] = get(props, propsToShare, propsToShare);
    }
    else if (Array.isArray(propsToShare)) {
      propsToShare.forEach(prop => {
        const split = prop.split(".");
        toShare[split.pop()] = get(props, prop, prop);
      });
    }
    else {
      for (const prop in propsToShare) {
        toShare[prop] = get(props, propsToShare[prop], propsToShare[prop]);
      }
    }
    return (
      <Component { ...props }>
        { React.Children.map(children, child => React.cloneElement(child, toShare)) }
      </Component>
    )
  }
}
export default dmsShare
