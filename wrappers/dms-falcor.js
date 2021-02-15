import React from "react"

import { avlFalcor } from "@availabs/avl-components"

import get from "lodash.get"

import {
  makeFilter,
  // ITEM_REGEX,
  PROPS_REGEX
} from "../utils"

const processPath = (path, props) => {
  return path.map(p => {
    const match = PROPS_REGEX.exec(p);
    if (match) {
      return get(props, match[1], null);
    }
    return p;
  })
}

const getDataItems = (path, falcorCache, filter = false) => {
  const length = get(falcorCache, [...path, "length"], 0);

  const dataItems = [];
  for (let i = 0; i < length; ++i) {
    const p = get(falcorCache, [...path, "byIndex", i, "value"], null);
    if (p) {
      const dataItem = JSON.parse(JSON.stringify(get(falcorCache, [...p], {}))),
        data = get(dataItem, ["data", "value"], null);
      if (data) {
        dataItem.data = data;
        dataItems.push(dataItem);
      }
    }
  }
  return filter ? dataItems.filter(filter) : dataItems;
}

const DefaultOptions = {
  loading: true
}

const dmsFalcor = (WrappedComponent, options = {}) => {
  class Wrapper extends React.Component {
    state = { loading: 0 };

    MOUNTED = false;
    componentDidMount() {
      this.MOUNTED = true;
      this.fetchFalcorDeps();
    }
    componentWillUnmount() {
      this.MOUNTED = false;
    }
    setState(...args) {
      this.MOUNTED && super.setState(...args);
    }

    startLoading(bool = true) {
      this.setState(({ loading }) => ({ loading: bool ? ++loading : loading }));
    }
    stopLoading(bool = true) {
      this.setState(({ loading }) => ({ loading: bool ? --loading : loading }));
    }

    fetchFalcorDeps(loading = true) {
      this.startLoading(loading);
      const { path } = this.props;
      return this.props.falcor.get([...path, "length"])
        .then(res => {
          let length = get(res, ["json", ...path, "length"], 0);
          if (length) {
            return this.props.falcor.get(
              [...path, "byIndex", { from: 0, to: length - 1 },
                ["id", "app", "type", "data", "updated_at"]
              ]
            )
          }
        }).then(() => this.stopLoading(loading))
    }
    apiInteract(action, id, data, options = {}) {
      let falcorAction = false;

      options = {
        ...DefaultOptions,
        ...options
      }

      switch (action) {
        case "api:edit":
          falcorAction = this.falcorEdit;
          break;
        case "api:create":
          falcorAction = this.falcorCreate;
          break;
        case "api:delete":
          falcorAction = this.falcorDelete;
          break;
        default:
          break;
      }

      if (falcorAction) {
        this.startLoading(options.loading);
        return Promise.resolve(falcorAction.call(this, action, id, data))
          .then(() => this.fetchFalcorDeps(options.loading))
          .then(() => this.stopLoading(options.loading));
      }
      return Promise.resolve();
    }
    falcorEdit(action, id, data) {
      if (!(id && data)) return;

      return this.props.falcor.call(["dms", "data", "edit"], [id, data]);
    }
    falcorCreate(action, id, data) {
      const args = [this.props.app, this.props.type, data].filter(Boolean);

      if (args.length < 3) return;

      return this.props.falcor.call(["dms", "data", "create"], args);
    }
    falcorDelete(action, id, ids) {
      ids = ids || [];
      const args = [this.props.app, this.props.type, id, ...ids].filter(Boolean);

      if (args.length < 3) return;

      return this.props.falcor.call(["dms", "data", "delete"], args);
    }
    render() {
      return (
        <WrappedComponent { ...this.props } loading={ Boolean(this.state.loading) }
          apiInteract={ (...args) => this.apiInteract(...args) }/>
      )
    }
  }
  const mS2P = (falcorCache, props) => {
    const { app, type } = get(props, "format", props),
      defaultPath = ["dms", "data", `${ app }+${ type }`],
      path = processPath(get(props, "path", defaultPath), props),
      dataItems = getDataItems(path, falcorCache, makeFilter(props.filter, { props, item: get(props, type, null) }));
    return {
      dataItems,
      path,
      app,
      type
    }
  }
  const mapCacheToProps = (falcorCache, props) =>
    mS2P(falcorCache, { ...props, ...options });

  return avlFalcor(Wrapper, { mapCacheToProps });
}
export default dmsFalcor;
