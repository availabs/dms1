import React from "react"

import {
  Button,
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
  DisplayComp = DefaultDisplay, inputProps, type, verify, showControls,
  verifyValue = utilityVerify, hasValue = defaultHasValue,
  getEmptyValue = defaultGetEmptyValue, ...props }, ref) => {

  value = value || [];

  const [newItem, setNewItem] = React.useState(getEmptyValue),
    [editIndex, setEditIndex] = React.useState(null),
    [openCreate, setOpenCreate] = React.useState(false),

    addToArray = React.useCallback(e => {
      const newValue = [...value];
      if (editIndex === null){
        newValue.push(newItem);
      }
      else {
        newValue[editIndex] = newItem;
      }

      onChange(newValue);
      setNewItem(getEmptyValue());
      setEditIndex(null);
      setOpenCreate(false);
    }, [value, newItem, onChange, getEmptyValue, editIndex]),

    removeFromArray = React.useCallback(v => {
      onChange(value.filter(vv => vv !== v));
    }, [value, onChange]),

    createNewItem = React.useCallback(e => {
      setOpenCreate(!openCreate);
      setEditIndex(null);
      setNewItem(getEmptyValue());
    }, [openCreate, getEmptyValue]),

    editItem = React.useCallback((v, i) => {
      setEditIndex(i);
      setNewItem(v);
      setOpenCreate(false);
    }, []),
    cancelEdit = React.useCallback(() => {
      setEditIndex(null);
      setNewItem(getEmptyValue());
    }, [getEmptyValue]),

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
            buttonTheme={ openCreate ? "buttonDanger" : "buttonSuccess" }>
            { openCreate ? 'cancel' : 'create new' }
          </Button>
        </div>

        { !openCreate ? null :
          <div>
            <EditComponent autoFocus
              Input={ Input }
              { ...props } { ...inputProps }
              ref={ ref }
              value={ newItem }
              onChange={ setNewItem }
              onKeyDown={ onKeyDown }
              disabled={ disabled }
              controls={ showControls ? {} :
                { addToArray,
                  save: addToArray,
                  create: addToArray,
                }
              }
              placeholder={ `Type a value...` }>

              { !showControls ? null :
                <div className="flex">
                  <div className="flex-1">
                    <Button onClick={ addToArray }
                      buttonTheme="buttonSuccess"
                      disabled={ buttonDisabled }>
                      save
                    </Button>
                  </div>
                  <div className="flex-0">
                    <Button onClick={ createNewItem }
                      buttonTheme="buttonDanger">
                      cancel
                    </Button>
                  </div>
                </div>
              }
            </EditComponent>
          </div>
        }
      </div>
      { !value.length ? null :
        value.map((v, i) =>
          editIndex === i ? (
            <React.Fragment key={ i }>
              <div className="my-2 border"/>
              <EditComponent
                Input={ Input }
                { ...props } { ...inputProps }
                value={ newItem } autoFocus
                onChange={ setNewItem }
                onKeyDown={ onKeyDown }
                disabled={ disabled }
                controls={
                  showControls ? {} :
                  { addToArray,
                    save: addToArray,
                    edit: addToArray,
                    moveUp: e => move(i, 1),
                    canMoveUp: i > 0,
                    moveDown: e => move(i, -1),
                    canMoveDown: i < (value.length - 1)
                  }
                }
                placeholder={ `Type a value...`}>

                { !showControls ? null :
                  <div className="flex">
                    <div className="flex-1">
                      <Button onClick={ addToArray }
                        buttonTheme="buttonSuccess"
                        disabled={ buttonDisabled }>
                        save
                      </Button>
                    </div>
                    <div className="flex-0">
                      <Button onClick={ cancelEdit }
                        buttonTheme="buttonDanger">
                        cancel
                      </Button>
                    </div>
                  </div>
                }
              </EditComponent>
            </React.Fragment>
          ) : (
            <React.Fragment key={ i }>
              <div className="my-2 border"/>
              { !showControls ? (
                  <DisplayComp
                    value={ v }
                    edit={ e => editItem(v, i) }
                    remove={ e => removeFromArray(v) }
                    moveUp={ e => move(i, 1) }
                    canMoveUp={ i > 0 }
                    moveDown={ e => move(i, -1) }
                    canMoveDown={ i < (value.length - 1) }/>
                ) : (
                  <div className='w-full'>
                    <ValueItem
                      edit={ e => editItem(v, i) }
                      remove={ e => removeFromArray(v) }
                      moveUp={ e => move(i, 1) }
                      canMoveUp={ i > 0 }
                      moveDown={ e => move(i, -1) }
                      canMoveDown={ i < (value.length - 1) }>

                      <DisplayComp value={ v } />

                    </ValueItem>
                  </div>
                )
              }
            </React.Fragment>
          )
        )
      }
    </div>
  )
})
export default OrderedArrayInput;

const ValueItem = ({ edit, remove, moveUp, canMoveUp, moveDown, canMoveDown, children }) =>
  <div className="flex">
    <div className="flex-0 flex flex-col mr-1">
      <Button small className="h-8 mb-1"
        disabled={ !canMoveUp }
        onClick={ moveUp }>
        <span className="fa fa-arrow-up"/>
      </Button>
      <Button small className="h-8"
        disabled={ !canMoveDown }
        onClick={ moveDown }>
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

const EditComponent = React.forwardRef(({ Input, children, controls = {}, ...props }, ref) =>
  <div>
    <div className="my-2">
      <Input { ...props } ref={ ref } { ...controls }/>
    </div>
    { children }
  </div>
)
