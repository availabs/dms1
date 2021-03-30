import React from "react"

import get from "lodash.get"

import { Select, useTheme } from "@availabs/avl-components"

const TypeSelect = ({ Attribute, onChange, value }) => {
  value = value || {};

  const handleChange = React.useCallback(v => {
    onChange({ attribute: v });
  }, [onChange]);

  const Selected = get(Attribute, "SelectedAttribute", null);

  const theme = useTheme();

  return (
    <div>

      <Select options={ get(Attribute, "Attributes", []) }
        value={ value.attribute }
        onChange={ handleChange }
        multi={ false }
        searchable={ false }
        accessor={ v => `${ v.name } (${ v.type })` }
        valueAccessor={ v => v.key }/>

      { !Selected ? null :
        <div className={ `border-l-4 pl-2 my-2 pb-1
            ${ Selected.fullWidth || (Selected.type === "richtext") || (Selected.type === "img") ? "w-full" : "max-w-4xl" }
            ${ !Selected.verified ? theme.borderDanger : Selected.required ? theme.borderSuccess :
                Selected.hasValue ? theme.borderInfo : theme.borderLight }
            ${ Selected.hidden ? 'hidden' : '' }
          ` }>
          <label htmlFor={ Selected.id }>{ Selected.name }</label>
          <Selected.Input autoFocus
            value={ Selected.value } onChange={ Selected.onChange }/>
        </div>
      }

    </div>
  )
}
export default TypeSelect;
