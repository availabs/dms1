import React from "react"

import { useDmsSections } from "./utils/dms-input-utils"

const dmsInputWrapper = Component => {
  return React.forwardRef(({ Attribute, autoFocus = false, onFocus, onBlur, onChange, value, ...props }, ref) => {
    value = value || {};

    const handleChange = React.useCallback((k, v) => {
      onChange(prev => ({ ...prev, [k]: typeof v === "function" ? v(prev[k]) : v }));
    }, [onChange]);

    const Sections = useDmsSections(Attribute.Attributes, handleChange);

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

    return (
      <Component { ...props } ref={ ref }
        Sections={ Sections }
        autoFocus={ autoFocus }
        hasFocus={ hasFocus }
        onFocus={ _onFocus }
        onBlur={ _onBlur }
        value={ value }/>
    )
  })
}
export default dmsInputWrapper;
