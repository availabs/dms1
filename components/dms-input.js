import React from "react"

// import { useDms } from "../contexts/dms-context"
// import { useAuth } from "../contexts/auth-context"
import { useTheme } from "modules/avl-components/src"

// import { useSetSections } from "../wrappers/dms-create"

import dmsInputWrapper from "../wrappers/dms-input"

const DmsInput = dmsInputWrapper(({ Sections, hasFocus, id, autoFocus = false, onFocus, onBlur, value, ref, ...props }) => {

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
                    onFocus={ onFocus } onBlur={ onBlur }/>
                </div>
              )
            }
          </div>
        )
      }
    </div>
  )
})
export default DmsInput;
