import React from "react"

import {
  Button, ValueContainer, ValueItem,
  verifyValue as utilityVerify, hasValue as defaultHasValue,
  useSetRefs
} from "@availabs/avl-components"

const DefaultDisplay = ({ value }) => {
  switch (typeof value) {
    case "object":
      return JSON.stringify(value, null, 3);
    default:
      return value.toString();
  }
};
const defaultGetEmptyValue = () => null;

export default React.forwardRef(({ Input, onChange, value, disabled, autoFocus,
  DisplayComp = DefaultDisplay, inputProps, type, verify,
  verifyValue, hasValue = defaultHasValue,
  getEmptyValue = defaultGetEmptyValue, ...props }, ref) => {

  value = value || [];

  const [node, setNode] = React.useState(null),
    [newItem, setNewItem] = React.useState(getEmptyValue),

    addToArray = React.useCallback(e => {
      const newValue = [...value, newItem];
      onChange(newValue);
      setNewItem(getEmptyValue());
      node && node.focus();
    }, [value, newItem, node, onChange, getEmptyValue]),

    removeFromArray = React.useCallback(v => {
      onChange(value.filter(vv => vv !== v));
    }, [value, onChange]),

    editItem = React.useCallback(v => {
      setNewItem(v);
      removeFromArray(v);
      node && node.focus();
    }, [node, removeFromArray]),

    buttonDisabled = React.useMemo(() =>
      disabled ||
      !hasValue(newItem) ||
      value.includes(newItem) ||
      !(verifyValue ? verifyValue(newItem) : utilityVerify(newItem, type, verify)) ||
      ((type === "number") && !value.reduce((a, c) => a && (+c !== +newItem), true))
    , [value, newItem, hasValue, verifyValue, verify, type, disabled]),

    onKeyDown = React.useCallback(e => {
      if (!buttonDisabled && e.keyCode === 13) {
        e.stopPropagation();
        e.preventDefault();
        addToArray();
      }
    }, [addToArray, buttonDisabled]);

  return (
    <div className="w-full">
      <div className="flex">
        <Input value={ newItem } onChange={ setNewItem } { ...props } { ...inputProps }
          disabled={ disabled } autoFocus={ autoFocus } onKeyDown={ onKeyDown }
          placeholder={ `Type a value...`} ref={ useSetRefs(ref, setNode) }/>
        <Button onClick={ addToArray } className="ml-1"
          disabled={ buttonDisabled }>
          add
        </Button>
      </div>
      { !value.length ? null :
        <div className="mt-1 ml-10">
          <ValueContainer>
            { value.map((v, i) => (
                <ValueItem key={ i } edit={ e => editItem(v) }
                  remove={ e => removeFromArray(v) }>
                  { <DisplayComp value={ v }/> }
                </ValueItem>
              ))
            }
          </ValueContainer>
        </div>
      }
    </div>
  )
})
