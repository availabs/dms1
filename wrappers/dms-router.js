import React from "react"

import { Redirect } from "react-router-dom"

import { RouterContext } from "../contexts"

import {
  useRouteMatch, useParams,
  useHistory, useLocation,
  Switch, Route
} from "react-router-dom"

import get from "lodash.get"

const useSearchParams = () => {
  const { search } = useLocation();
  return React.useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return [...searchParams.entries()]
      .reduce((a, [k, v]) => {
        a[k] = v;
        return a;
      }, {});
  }, [search]);
}

const GetParams = ({ Component, ...others }) => {
    const { path } = useRouteMatch()
    const routerParams = useParams(),
    props = useSearchParams();
    const action = path.replace(others.basePath, '').split('/').filter(f => f.length)

    return path.includes('/auth/login') ? <Component { ...others } routerParams={ { ...routerParams, props } }/> :
        <Component { ...others } routerParams={ { ...routerParams, props, ...{action: action[0]} } }/>;
}

const ParseItems = ({ Component, ...props}) => {
  const { action, attribute, value } = useParams();

  const id = get(props, "dataItems", []).reduce((a, c) => {
    const cValue = get(c, ["data", attribute], null);
    return String(cValue).toLowerCase() === String(value).toLowerCase() ? c.id : a;
  }, undefined);

  if (!id) return <Component key="no-id" { ...props }/>;

  return <Redirect to={ `${ props.basePath }${ action }/${ id }` }/>
  // return <Component { ...props } routerParams={ { action, id } }/>
}

const dmsRouter = (Component, options = {}) =>
  props => {
    const { path } = useRouteMatch(),
      alt11 = `${ path }/:action`,
      alt13 = `${ path }/:action/:id`,
      alt21 = `${ path }/:action/:attribute/:value`;
    const hardCodedPath = path === '/' ? `` : path

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
          <Route exact  path={ [
              `${hardCodedPath}/landing`,
              `${hardCodedPath}/auth/login`,
              `${hardCodedPath}/dms:create`,
              `${hardCodedPath}/dms:edit/:id`
                              ] }>
            <GetParams { ...props } { ...routerProps } Component={ Component }/>
          </Route>
          {/*{actions.map(act =>
            <Route exact path={ [`${path}/${action}`, `${path}/${action}/:id`] }>
              <GetParams { ...props } { ...routerProps } Component={ Component }/>
            </Route>
          }*/}
          <Route exact path={ alt21 }>
            <ParseItems { ...props } { ...routerProps } Component={ Component }/>
          </Route>
        </Switch>
      </RouterContext.Provider>
    )
  }
export default dmsRouter;
