import React from "react"

import get from "lodash.get"

import { Select, useTheme } from "@availabs/avl-components"

const TypeSelect = ({ Attribute, onChange, value }) => {
  value = value || {};

  const handleTypeChange = React.useCallback(key => {
    const att = Attribute.Attributes.reduce((a, c) => c.key === key ? c : a, {});
    onChange({ key: att.key, name: att.name, type: att.type, value: undefined });
  }, [Attribute, onChange]);

  const handleValueChange = React.useCallback((k, v) => {
    onChange({ ...value, value: v });
  }, [onChange, value]);

  const Selected = Attribute.Attributes.reduce((a, c) => {
    return c.key === value.key ? c : a;
  }, null);

  if (Selected) {
    Selected.setValues = handleValueChange;
  }

console.log("<type-select> Selected:", Selected, value);

  const theme = useTheme();

  return (
    <div>

      <Select options={ get(Attribute, "Attributes", []) }
        value={ value.key }
        valueAccessor={ att => att.key }
        onChange={ handleTypeChange }
        multi={ false }
        searchable={ false }
        accessor={ att => `${ att.name } (${ att.type })` }/>

      { !Selected ? null :
        <div className={ `border-l-4 pl-2 my-2 pb-1
            ${ Selected.fullWidth || (Selected.type === "richtext") || (Selected.type === "img") ? "w-full" : "max-w-4xl" }
            ${ !Selected.verified ? theme.borderDanger : Selected.required ? theme.borderSuccess :
                Selected.hasValue ? theme.borderInfo : theme.borderLight }
            ${ Selected.hidden ? 'hidden' : '' }
          ` }>
          <label htmlFor={ Selected.id }>{ Selected.name }</label>
          <Selected.Input autoFocus
            value={ value.value } onChange={ Selected.onChange }/>
        </div>
      }

    </div>
  )
}
export default TypeSelect;
