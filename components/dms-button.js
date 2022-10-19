import React, { useState, useEffect } from "react"

import {  ButtonContext } from "../contexts"

import { useMakeInteraction } from "../wrappers/dms-provider"

import { Button, LinkButton } from "modules/avl-components/src"

import get from "lodash.get"

const cleanAction = action =>
  action.replace(/^(dms|api):(.+)$/, (m, c1, c2) => c2);

const DEFAULT_BUTTON_THEMES = {
  // create: "button",
  // back: "button",
  // edit: "button",
  delete: "buttonDanger",
  cancel: "buttonInfo"
}

const getButtonTheme = (themes, label, action)=> {
  action = cleanAction(action);
  let theme = get(themes, label, get(DEFAULT_BUTTON_THEMES, label, null));
  if (theme) return theme;
  return get(themes, action, get(DEFAULT_BUTTON_THEMES, action, "button"));
}

const ActionButton = ({ action, label, buttonTheme, ...props }) => {
  label = label || cleanAction(action);
  return (
    <ButtonContext.Consumer>
      { ({ buttonThemes }) =>
        <Button { ...props } buttonTheme={ buttonTheme || getButtonTheme(buttonThemes, label, action) }>
          { label }
        </Button>
      }
    </ButtonContext.Consumer>
  )
}

const ActionLink = ({ action, label, buttonTheme, ...props }) => {
  label = label || cleanAction(action);
  return (
    <ButtonContext.Consumer>
      { ({ buttonThemes }) =>
        <LinkButton { ...props } buttonTheme={ buttonTheme || getButtonTheme(buttonThemes, label, action) }>
          { label  }
        </LinkButton>
      }
    </ButtonContext.Consumer>
  )
}

const OpenConfirm = ({ Button, ...props }) => {
  const OpenedAndWating = ({ setOpen }) => {
    const [waiting, setWaiting] = useState(true);
    useEffect(() => {
      const timeout = waiting && setTimeout(setWaiting, 1000, false);
      return () => clearTimeout(timeout);
    }, [waiting])
    return (
      <div>
        <Button waiting={ waiting }/>
        <ActionButton action="cancel"
          className="ml-1"
          onClick={ e => {
            e.stopPropagation();
            setOpen(false);
          } }/>
      </div>
    )
  }
  const [openConfirm, setOpen] = useState(false);
  return openConfirm ? <OpenedAndWating setOpen={ setOpen }/> :
    <ActionButton { ...props }
      onClick={ e => { e.stopPropagation(); setOpen(true); } }/>
}

export const DmsButton = ({ action, item, props = {}, disabled = false, ...others }) => {
  const { showConfirm, type, to, ...interaction } = useMakeInteraction(action, item, props);

  const Disabled = disabled || interaction.disabled;

  const RenderButton = ({ waiting }) => {
    if (waiting) {
      return <ActionButton { ...interaction } { ...others }
        disabled={ true }/>
    }
    switch (type) {
      case "link":
        return <ActionLink { ...interaction } { ...others } to={ to }
          disabled={ Disabled }/>
      default:
        return <ActionButton { ...interaction } { ...others }
          disabled={ Disabled }/>
    }
  }

  if (!Disabled && showConfirm) {
    return <OpenConfirm Button={ RenderButton } { ...interaction } { ...others }/>
  }
  return <RenderButton />;
}
