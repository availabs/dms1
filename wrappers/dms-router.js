import React from "react"

import { Redirect } from "react-router-dom"

import { RouterContext } from "../contexts"

import {
  useRouteMatch, useParams,
  useHistory, useLocation,
  Switch, Route
} from "react-router-dom"

import get from "lodash.get"

const GetParams = ({ Component, ...others }) => {
  const routerParams = useParams(),
    { search } = useLocation();
  const searchParams = new URLSearchParams(search),
    props = [...searchParams.entries()]
      .reduce((a, [k, v]) => {
        a[k] = v;
        return a;
      }, {});
  return <Component { ...others } routerParams={ { ...routerParams, props } }/>;
}

const ParseItems = ({ Component, ...props}) => {
  const { action, attribute, value } = useParams();

  const id = get(props, "dataItems", []).reduce((a, c) => {
    const cValue = get(c, ["data", attribute], null)
      .toString().toLowerCase();
    return cValue === value.toString().toLowerCase() ? c.id : a;
  }, undefined);

  if (!id) return <Component key="no-id" { ...props }/>;

  return <Redirect to={ `${ props.basePath }/${ action }/${ id }` }/>
  // return <Component { ...props } routerParams={ { action, id } }/>
}

const dmsRouter = (Component, options = {}) =>
  props => {
    const { path } = useRouteMatch(),
      alt11 = `${ path }/:action`,
      alt13 = `${ path }/:action/:id`,
      alt21 = `${ path }/:action/:attribute/:value`;

    const location = useLocation(),
      history = useHistory();

    const routerProps = React.useMemo(() => ({
      useRouter: true,
      basePath: path,
      location,
      history
    }), [path, location, history]);

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
export default dmsRouter;
