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
      return `${ value }`;
  }
};
const defaultGetEmptyValue = () => null;

const DefaultEditComponent = React.forwardRef(({ Input, children, controls = {}, ...props }, ref) => {
  const {
    addToArray,
    createNewItem,
    buttonDisabled,
    cancelEdit
  } = controls;
  return (
    <div className="w-full mt-2 pt-2 border-t-2">
      <div className="mb-2">
        <Input { ...props } ref={ ref }/>
      </div>

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

      { children }

    </div>
  )
})

const DefaultDisplayControls = ({ edit, remove, moveUp, canMoveUp, moveDown, canMoveDown, children }) =>
  <div className="flex w-full mt-2 pt-2 border-t-2">
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

const DefaultCreateButton = ({ create, opened }) =>
  <div>
    <Button className="p-2"
      onClick={ create }
      buttonTheme={ opened ? "buttonDanger" : "buttonSuccess" }>
      { opened ? 'cancel' : 'create new' }
    </Button>
  </div>

const OrderedArrayInput = React.forwardRef(({ Input, onChange, value, disabled, autoFocus,
  CreateButton = DefaultCreateButton,
  DisplayComp = DefaultDisplay,
  DisplayControls = DefaultDisplayControls,
  EditComponent = DefaultEditComponent,
  inputProps, type, verify, showControls,
  verifyValue = utilityVerify, hasValue = defaultHasValue,
  getEmptyValue = defaultGetEmptyValue, ...props }, ref) => {

  value = value || [];

// console.log("ORDERED ARRAY:", value, inputProps)

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
      setOpenCreate(false);
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

        <CreateButton opened={ openCreate }
          create={ createNewItem }/>

        { !openCreate ? null :
          <EditComponent ref={ ref } autoFocus
            Input={ Input }
            { ...props } { ...inputProps }
            value={ newItem }
            onChange={ setNewItem }
            onKeyDown={ onKeyDown }
            disabled={ disabled }
            controls={ {
              addToArray,
              buttonDisabled,
              cancelEdit,
              save: addToArray,
              create: addToArray
            } }
            placeholder={ `Type a value...` }/>
        }
      </div>
      { !value.length ? null :
        value.map((v, i) =>
          editIndex === i ? (
            <EditComponent key={ i } autoFocus
              Input={ Input }
              { ...props } { ...inputProps }
              value={ newItem }
              onChange={ setNewItem }
              onKeyDown={ onKeyDown }
              disabled={ disabled }
              controls={ {
                addToArray,
                buttonDisabled,
                cancelEdit,
                save: addToArray,
                edit: addToArray,
                moveUp: e => move(i, -1),
                canMoveUp: i > 0,
                moveDown: e => move(i, 1),
                canMoveDown: i < (value.length - 1)
              } }
              placeholder={ `Type a value...`}/>
          ) : (
            <DisplayControls key={ i }
              edit={ e => editItem(v, i) }
              remove={ e => removeFromArray(v) }
              moveUp={ e => move(i, -1) }
              canMoveUp={ i > 0 }
              moveDown={ e => move(i, 1) }
              canMoveDown={ i < (value.length - 1) }
              value={ v }>

              <DisplayComp value={ v } />

            </DisplayControls>
          )
        )
      }
    </div>
  )
})
export default OrderedArrayInput;
