import React, { useContext } from "react"

const noop = () => {};

const DmsContext = React.createContext({
  dataItems: [],
  interact: noop,
  makeInteraction: noop,
  makeOnClick: noop
});

export const useDms = () => useContext(DmsContext);

export default DmsContext
