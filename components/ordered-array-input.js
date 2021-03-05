import React from "react"
import get from 'lodash.get'

import {
  Button, useSetRefs,
  verifyValue as utilityVerify,
  hasValue as defaultHasValue
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

const OrderedArrayInput = React.forwardRef(({ Input, onChange, value, disabled, autoFocus,
  DisplayComp = DefaultDisplay, inputProps, type, verify,
  verifyValue = utilityVerify, hasValue = defaultHasValue,
  getEmptyValue = defaultGetEmptyValue, ...props }, ref) => {

  value = value || [];

  const [node, setNode] = React.useState(null),
    [newItem, setNewItem] = React.useState(getEmptyValue),
    [editIndex, setEditIndex] = React.useState(null),
    [openEditor, setOpenEditor] = React.useState(false),

    addToArray = React.useCallback(e => {
      const newValue = editIndex === null ?
        [...value, newItem] :
        Object.assign([], value, {[editIndex]: newItem});

      onChange(newValue);
      setNewItem(getEmptyValue());
      setEditIndex(null);
      setOpenEditor(false);
      node && node.focus();
    }, [value, newItem, node, onChange, getEmptyValue, editIndex]),

    removeFromArray = React.useCallback(v => {
      onChange(value.filter(vv => vv !== v));
    }, [value, onChange]),

    createNewItem = React.useCallback(e => {
      setOpenEditor(!openEditor);
      setEditIndex(null);
      setNewItem(getEmptyValue());
    }, [openEditor,getEmptyValue]),

    editItem = React.useCallback((v,i) => {
      setEditIndex(i);
      setNewItem(v);
      setOpenEditor(false);
      node && node.focus();
    }, [node]),

    buttonDisabled = React.useMemo(() =>
      disabled ||
      !hasValue(newItem) ||
      value.includes(newItem) ||
      !verifyValue(newItem, type, verify) ||
      ((type === "number") && !value.reduce((a, c) => a && (+c !== +newItem), true))
    , [value, newItem, hasValue, verifyValue, verify, type, disabled]),

    onKeyDown = React.useCallback(e => {
      if (!buttonDisabled && e.keyCode === 13) {
        e.stopPropagation();
        e.preventDefault();
        addToArray();
      }
    }, [addToArray, buttonDisabled]),

    move = React.useCallback((index, dir) => {
      if (((index + dir) < 0) || ((index + dir) >= value.length)) return;
      const newValue = [...value],
        [item] = newValue.splice(index, 1);
      newValue.splice(index + dir, 0, item);
      onChange(newValue);
    }, [onChange, value]);

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <div>
          <Button
            className={'p-2'}
            onClick={ createNewItem }
            buttonTheme={ openEditor ? "buttonDanger" : "buttonSuccess" }>
            { openEditor ? 'cancel' : <div>create new</div> }
          </Button>
        </div>
        <div style={ { display: openEditor ? "block" : "none" } }>
          <EditComponent
            Input={ Input }
            { ...props } { ...inputProps }
            ref={ useSetRefs(ref, setNode) }
            value={ newItem }
            onChange={ setNewItem }
            autoFocus={ autoFocus }
            onKeyDown={ onKeyDown }
            disabled ={ disabled }
            save={addToArray}
            placeholder={ `Type a value...`}>

            {get(Input.settings, 'hasControls', false) ? '' :
            <Button onClick={ addToArray }
              buttonTheme="buttonSuccess"
              disabled={ buttonDisabled }>
              create
            </Button>}
          </EditComponent>
        </div>
      </div>
      { !value.length ? null :
        value.map((v, i) =>
          editIndex === i ?
            <EditComponent
              Input={ Input }
              { ...props } { ...inputProps }
              value={ newItem }
              onChange={ setNewItem }
              autoFocus={ autoFocus }
              onKeyDown={ onKeyDown }
              disabled ={ disabled }
              move={ m => move(i, m) }
              addToArray={ addToArray }
              placeholder={ `Type a value...`}>

              {get(Input.settings, 'hasControls', false) ? '' :
                <Button onClick={ addToArray }
                buttonTheme="buttonSuccess"
                disabled={ buttonDisabled }>
                Save
              </Button>}
            </EditComponent>
          :
            get(Input.settings, 'hasControls', false) ?
              <DisplayComp
                  value={ v }
                  edit={ e => editItem(v,i) }
                  remove={ e => removeFromArray(v) }
                  moveUp={ i > 0 ? e => move(i,-1) : null }
                  moveDown={ i < value.length-1 ? e => move(i,1) : null }
                /> :
              <div className='w-full'>
                <ValueItem
                  edit={ e => editItem(v, i) }
                  remove={ e => removeFromArray(v) }
                  move={ m => move(i, m) }
                  index={ i }
                  length={ value.length }>
                    <DisplayComp value={ v } />
                </ValueItem>
              </div>
        )
      }
    </div>
  )
})
export default OrderedArrayInput;

const ValueItem = ({ edit, remove, move, index, length, children }) =>
  <div>
    <div className="flex">
      <div className="flex-0 flex flex-col mr-1">
        <Button small className="h-8 mb-1"
          disabled={ index - 1 < 0 }
          onClick={ e => move(-1) }>
          <span className="fa fa-arrow-up"/>
        </Button>
        <Button small className="h-8"
          disabled={ index + 1 >= length }
          onClick={ e => move(1) }>
          <span className="fa fa-arrow-down"/>
        </Button>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-start">
          <Button onClick={ edit }
            buttonTheme="buttonPrimarySmall">
            edit
          </Button>
          <Button className="ml-1" onClick={ remove }
            buttonTheme="buttonDangerSmall">
            remove
          </Button>
        </div>
        <div className="ml-2">
          { children }
        </div>
      </div>
    </div>
  </div>

const EditComponent = React.forwardRef(({ Input, children, ...props }, ref) =>
  <div>
    <div className="my-2">
      <Input { ...props } ref={ ref }/>
    </div>
    { children }
  </div>
)
