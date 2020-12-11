import React from "react"

import { useDms } from "../contexts/dms-context"
import { useAuth } from "../contexts/auth-context"
import { useTheme } from "@availabs/avl-components"

import { useSetSections } from "../wrappers/dms-create"

import {
  useDmsSections
} from "./utils/dms-input-utils"

export default React.forwardRef(({ Attribute, id, autoFocus = false, onFocus, onBlur, onChange, value, ...props }, ref) => {
  value = value || {};

  const Props = { ...props, ...useDms(), user: useAuth().user };

  const sections = useSetSections(Attribute.Format),
    Sections = useDmsSections(sections, value, onChange, Props);

  const [hasFocus, setFocus] = React.useState(autoFocus),
    [prev, setPrev] = React.useState(hasFocus),
    _onFocus = React.useCallback(() => setFocus(true), [setFocus]),
    _onBlur = React.useCallback(() => setFocus(false), [setFocus]);

  React.useEffect(() => {
    if (hasFocus !== prev) {
      (typeof onBlur === "function") && !hasFocus && onBlur();
      (typeof onFocus === "function") && hasFocus && onFocus();
      setPrev(hasFocus);
    }
  }, [hasFocus, prev, onFocus, onBlur]);

  const theme = useTheme();

  return (
    <div id={ id } className={ `
        w-full border-2 border-transparent rounded p-2 ${ theme.transition }
        ${ hasFocus ? theme.inputBorderFocus: theme.inputBorder }
      `}>
      { Sections.map(section =>
          <div key={ section.index }>
            { !section.title ? null :
              <div className="text-lg font-bold">{ section.title }</div>
            }
            { section.attributes.map(({ Input, key, ...att }, i) =>
                <div key={ key } className={ `border-l-4 pl-2 pb-2 mb-2 last:mb-0
                  ${ !att.verifyValue(value[key]) ? theme.borderDanger : att.required ? theme.borderSuccess :
                    att.checkHasValue(value[key]) ? theme.borderInfo : theme.borderLight }
                  ${ att.hidden ? 'hidden' : '' }
                ` }>
                  <label htmlFor={ att.id }>{ att.name }</label>
                  <Input { ...props } onChange={ att.onChange } value={ value[key] }
                    ref={ (section.index === 0) && (i === 0) ? ref : null }
                    autoFocus={ autoFocus && (section.index === 0) && (i === 0) }
                    onFocus={ _onFocus } onBlur={ _onBlur }/>
                </div>
              )
            }
          </div>
        )
      }
    </div>
  )
})
