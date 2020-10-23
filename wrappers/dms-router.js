import React from "react"

import { RouterContext } from "../contexts"

import {
  useRouteMatch, useParams,
  useHistory, useLocation,
  Switch, Route
} from "react-router-dom"

import get from "lodash.get"

const GetParams = ({ Component, ...others }) => {
  const params = useParams(),
    { search } = useLocation();
  const searchParams = new URLSearchParams(search),
    props = [...searchParams.entries()]
      .reduce((a, [k, v]) => {
        a[k] = v;
        return a;
      }, {});
  return <Component { ...others } params={ { ...params, props } }/>;
}

const ParseItems = ({ Component, ...props}) => {
  const { action, attribute, value } = useParams();

  const id = get(props, "dataItems", []).reduce((a, c) => {
    return get(c, ["data", attribute], null) === value ? c.id : a;
  }, undefined);

  if (!id) return <Component key="no-id" { ...props }/>;

  return <Component { ...props } params={ { action, id } }/>
}

export default (Component, options = {}) => {
  return ({ ...props }) => {
    const { path } = useRouteMatch(),
      alt11 = `${ path }/:action`,
      alt13 = `${ path }/:action/:id`,
      alt21 = `${ path }/:action/:attribute/:value`,
      routerProps = {
        basePath: path,
        useRouter: true,
        location: useLocation(),
        history: useHistory()
      };
    return (
      <RouterContext.Provider value={ routerProps }>
        <Switch>
          <Route exact path={ path }>
            <Component { ...props } { ...routerProps }/>
          </Route>
          <Route exact path={ [alt11, alt13] }>
            <GetParams { ...props } { ...routerProps } Component={ Component }/>
          </Route>
          <Route exact path={ alt21 }>
            <ParseItems { ...props } { ...routerProps } Component={ Component }/>
          </Route>
        </Switch>
      </RouterContext.Provider>
    )
  }
}
