import React, { useContext } from "react"

import {
  AuthContext,
  ButtonContext,
  DmsContext,
  MessengerContext,
  RouterContext
} from "../contexts"
import { checkAuth } from "../utils"

import { getItem, makeInteraction, makeOnClick, processFormat } from "./utils/dms-provider-utils"

import get from "lodash.get"

export const useMakeInteraction = (dmsAction, item, props) => {
  props = {
    ...props,
    ...useContext(DmsContext),
    ...useContext(AuthContext),
    ...useContext(RouterContext)
  }
  return makeInteraction(dmsAction, item, props)
}
export const useMakeOnClick = (dmsAction, item, props) => {
  props = {
    ...props,
    ...useContext(DmsContext),
    ...useContext(AuthContext),
    ...useContext(RouterContext)
  }
  return makeOnClick(dmsAction, item, props)
}

const processMessage = msg => ({
  canGoPrev: true,
  canGoNext: false,
  canGo: true,
  ...msg
})

let UNIQUE_ID = 0;
const newMsgId = () => `dms-msg-${ ++UNIQUE_ID }`;

export default (Component, options = {}) => {
  const {
    authRules = {},
    buttonThemes = {},
    imgUploadUrl = 'https://graph.availabs.org'
  } = options;

  class Wrapper extends React.Component {
    static defaultProps = {
      showHome: true,
      dataItems: [],
      defaultAction: ["list", null, null],
      app: "app-name",
      type: "format-type",
      format: null,
      apiInteract: () => Promise.resolve()
    }

    constructor(props) {
      super(props);

      this.registeredFormats = {};

      this.registeredFormats = processFormat(props.format);

      this.state = {
        stack: [{
          dmsAction: this.props.defaultAction[0],
          id: this.props.defaultAction[1],
          props: this.props.defaultAction[2]
        }],
        pageMessages: [],
        attributeMessages: []
      }
      this.interact = this.interact.bind(this);
      this.makeInteraction = this.makeInteraction.bind(this);
      this.makeOnClick = this.makeOnClick.bind(this);
    }

    componentDidMount() {
      const { action, id, props } = get(this.props, "routerParams", {});
      if (action) {
        this.interact(action, id, props);
      }
    }

    getItem(id) {
      return getItem(id, this.props);
    }

    makeOnClick(dmsAction, item, props) {
      return makeOnClick(dmsAction, item, { ...this.props, ...props, interact: this.interact })
    }
    makeInteraction(dmsAction, item, props) {
      return makeInteraction(dmsAction, item, { ...this.props, ...props, interact: this.interact });
    }

    interact(dmsAction, id, props, options) {
      if (arguments.length === 1) {
        id = dmsAction;
        dmsAction = "click";
      }

      const hasAuth = checkAuth(authRules, dmsAction, this.props, this.getItem(id));
      if (!hasAuth) return;

      if (/^(dms:)*back$/.test(dmsAction)) {
        this.popAction();
      }
      else if (/^(dms:)*home$/.test(dmsAction)) {
        this.clearStack();
      }
      else if (/^api:/.test(dmsAction)) {
        return this.props.apiInteract(dmsAction, id, props, options);
      }
      else {
        this.pushAction(dmsAction, id, props);
      }
    }

    pushAction(dmsAction, id, props) {
      const stack = this.props.useRouter ?
        this.state.stack.slice(0, 1) : [...this.state.stack];

      stack.push({ dmsAction, id, props });
      if (stack.length > 100) {
        stack.splice(1, 1);
      }
      this.setState({ stack });
    }
    popAction() {
      if (this.state.stack.length > 1) {
        const stack = [...this.state.stack];
        stack.pop();
        this.setState({ stack });
      }
    }
    clearStack() {
      const stack = [...this.state.stack].slice(0, 1);
      this.setState({ stack });
    }
    getTop() {
      const { stack } = this.state;
      return stack[stack.length - 1];
    }

    sendPageMessage = msg => {
      this.setState(state => {
        const { pageMessages } = state;
        return {
          pageMessages: [...pageMessages, processMessage(msg)]
        }
      })
    }
    removePageMessage = ids => {
      this.setState(state => {
        const { pageMessages } = state;
        return {
          pageMessages: pageMessages.filter(msg => !ids.includes(msg.id))
        };
      })
    }
    sendAttributeMessage = msg => {
      this.setState(state => {
        const { attributeMessages } = state;
        return {
          attributeMessages: [...attributeMessages, processMessage(msg)]
        };
      })
    }
    removeAttributeMessage = ids => {
      this.setState(state => {
        const { attributeMessages } = state;
        return {
          attributeMessages: attributeMessages.filter(msg => !ids.includes(msg.id))
        };
      })
    }
    getMessengerProps = () => ({
      pageMessages: this.state.pageMessages,
      attributeMessages: this.state.attributeMessages,
      sendPageMessage: this.sendPageMessage,
      removePageMessage: this.removePageMessage,
      sendAttributeMessage: this.sendAttributeMessage,
      removeAttributeMessage: this.removeAttributeMessage,
      newMsgId
    })

    getDmsProps() {
      const { app, type, dataItems, format } = this.props,
        { id, ...top } = this.getTop(),
        item = this.getItem(id);

      return {
        makeInteraction: this.makeInteraction,
        makeOnClick: this.makeOnClick,
        interact: this.interact,
        stack: this.state.stack,
        registeredFormats: this.registeredFormats,
        [type]: item,
        dataItems,
        format: this.registeredFormats[`${ format.app }+${ format.type }`],
        item,
        type,
        app,
        top,
        imgUploadUrl
      }
    }
    render() {
      const { user } = this.props,
        dmsProps = this.getDmsProps(),
        msgProps = this.getMessengerProps();
      return (
        <DmsContext.Provider value={ dmsProps }>
          <AuthContext.Provider value={ { authRules, user } }>
            <ButtonContext.Provider value={ { buttonThemes } }>
              <MessengerContext.Provider value={ msgProps }>
                <Component { ...this.props } { ...dmsProps } { ...msgProps }/>
              </MessengerContext.Provider>
            </ButtonContext.Provider>
          </AuthContext.Provider>
        </DmsContext.Provider>
      )
    }
  }
  return Wrapper;
}
