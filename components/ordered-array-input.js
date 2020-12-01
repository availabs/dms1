import React from "react"

import {
  Button, 
  //ValueContainer, ValueItem, useSetRefs,
  verifyValue as utilityVerify, hasValue as defaultHasValue
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

  const [node] = React.useState(null),
    [newItem, setNewItem] = React.useState(getEmptyValue),
    [editIndex, setEditIndex] = React.useState(null),
    [addItem, setAddItem] = React.useState(false),

    addToArray = React.useCallback(e => {
      //console.log('addToArray', editIndex)
      const newValue = editIndex === null ?
        [...value, newItem] :
        Object.assign([], value, {[editIndex]: newItem});

      onChange(newValue);
      setNewItem(getEmptyValue());
      setEditIndex(null)
      setAddItem(false)
      node && node.focus();
    }, [value, newItem, node, onChange, getEmptyValue, editIndex]),

    removeFromArray = React.useCallback(v => {
      onChange(value.filter(vv => vv !== v));
    }, [value, onChange]),

    addNewItem = React.useCallback(e => {
      setAddItem(!addItem)
      setEditIndex(null)
      setNewItem(getEmptyValue())
    }, [addItem,getEmptyValue]),

    move = React.useCallback((oldIndex,newIndex) => {
      let newValue = [...value]
      newValue.splice((newIndex), 0, newValue.splice(oldIndex, 1)[0])
      onChange(newValue)
    },[value,onChange]),

    editItem = React.useCallback((v,i) => {
      setEditIndex(i);
      setNewItem(v);
      setAddItem(false)
      node && node.focus();
    }, [node]),

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

  console.log('rerender', value)
  return (
    <div className="w-full">
      <div className="flex flex-col px-4 sm:px-6 lg:px-12">
        <div>
          <Button onClick={addNewItem} >
            {addItem ? 'Cancel' : 'Add Section'}
          </Button>
        </div>
        {addItem ?
          <div>
            <Input
              { ...props }
              { ...inputProps }
              value={ newItem }
              onChange={ setNewItem }
              autoFocus={ autoFocus }
              onKeyDown={ onKeyDown }
              addToArray={ addToArray }
              disabled ={ buttonDisabled }
              placeholder={ `Type a value...`}
            />
            {Input.hasSave ? '' :
              <Button onClick={ addToArray } disabled={ buttonDisabled }>
                Save
              </Button>
            }
          </div> : ''}
        </div>
        { !value.length ? null :
          value.map((v, i) => {
            return editIndex === i ?
              <div key={i}>
                <Input
                  { ...props }
                  { ...inputProps }
                  value={ newItem }
                  onChange={ setNewItem }
                  autoFocus={ autoFocus }
                  onKeyDown={ onKeyDown }
                  addToArray={ addToArray }
                  disabled ={ buttonDisabled }
                  placeholder={ `Type a value...`}
                />
                {Input.hasSave ? '' :
                  <Button onClick={ addToArray } disabled={ buttonDisabled }>
                    Save
                  </Button>
                }
              </div> :
              <div className='w-full' key={i}>
                {/* <ValueItem key={ i } edit={ e => editItem(v,i) }
                  remove={ e => removeFromArray(v) }> */}
                  { <DisplayComp
                      value={ v }
                      edit={ e => editItem(v,i) }
                      remove={ e => removeFromArray(v) }
                      moveUp={ i > 0 ? e => move(i, (i-1)) : null }
                      moveDown={ i < value.length-1 ? e => move(i, (i+1)) : null }
                    /> }
                {/*</ValueItem>*/}
              </div>
          })
        }
    </div>
  )
})
