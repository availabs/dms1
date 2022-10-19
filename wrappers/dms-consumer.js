import React, { useState, useEffect } from "react"

import { useAuth } from "../contexts/auth-context"
import { useDms } from "../contexts/dms-context"
import { mapDataToProps as doMapDataToProps, getValue } from "../utils"
import { hasValue } from "modules/avl-components/src"

// import get from "lodash.get"

const createElements = ({ data, Comp }, interact) =>
  data.map((d, i) =>
    <Comp key={ d.key } { ...d.props }
      onClick={ !d.interact.length ? null :
        e => interact(...d.interact)
      }>
      { d.value }
    </Comp>
  )

const dmsConsumer = (Component, options = {}) => {
  const {
    mapDataToProps = {},
    interactOnMount = []
  } = options;

  return ({ ...props }) => {
    const newProps = { ...props, ...useDms(), user: useAuth().user },
      { interact } = newProps;

    const [acted, setActed] = useState(false);

    let defaultInteract = [];
    if (!acted) {
      defaultInteract = [
        getValue(interactOnMount[0], { props: newProps }),
        getValue(interactOnMount[1], { props: newProps }),
        doMapDataToProps(interactOnMount[2] || {}, { props: newProps })
      ];
    }
    const [action, id, seededProps] = defaultInteract,
      numOnMount = interactOnMount.filter(hasValue).length,
      numInteract = defaultInteract.filter(hasValue).length,
      ready = Boolean(action) && (numOnMount === numInteract);

    useEffect(() => {
      if (!acted && ready) {
        interact(action, id, seededProps);
        setActed(true);
      }
    }, [acted, ready, interact, action, id, seededProps]);

    const handleData = data => {
      if (Array.isArray(data)) {
        return data.map(handleData);
      }
      if (typeof data === "function") {
        return data(createElements, newProps.interact);
      }
      return data;
    }

    const mapped = doMapDataToProps(mapDataToProps, { props: newProps })

    for (const key in mapped) {
      const data = mapped[key];
      newProps[key] = handleData(data);
    }
    return <Component { ...newProps }/>
  }
}
export default dmsConsumer;
