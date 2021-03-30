import React from "react"

import { hasValue, verifyValue } from "@availabs/avl-components"

import { isRequired, getAttributes } from "../../wrappers/utils/dms-create-utils"

import { useDms } from "../../contexts/dms-context"

import { getInput } from "../../wrappers/utils/get-dms-input"

import {
  checkDmsValue,
  checkEditorValue,
  verifyDmsValue,
  prettyKey
} from "../../utils"

class Attribute {
  constructor(att, props) {
    Object.assign(this, att);

    this.name = this.name || prettyKey(this.key);
    this.Input = getInput(this, props);
  }
  checkHasValue = value => {
    if (Array.isArray(value)) {
      return value && value.reduce((a, c) => a || hasValue(c), false)
    }
    return hasValue(value);
  }
  verifyValue = value => {
    if (this.checkHasValue(value)) {
      if (Array.isArray(value)) {
        return value.reduce((a, c) =>
          a && verifyValue(c, this.type, this.verify)
        , true)
      }
      else {
        return verifyValue(value, this.type, this.verify);
      }
    }
    return !this.required;
  }
}

class EditorAttribute extends Attribute {
  checkHasValue = value => {
    if (Array.isArray(value)) {
      return value.reduce((a, c) => a || checkEditorValue(c), false);
    }
    return checkEditorValue(value);
  }
  verifyValue = value => {
    return !this.required || this.checkHasValue(value);
  }
}
class DmsAttribute extends Attribute {
  constructor(att, formats, props) {
    super(att, props);

    this.Format = JSON.parse(JSON.stringify(formats[this.format]));
    this.attributes = getAttributes(this.Format, props.registeredFormats);

    this.required = this.isArray ? this.required : isRequired(this.attributes);
  }
  checkHasValue = (value, attributes = this.attributes) => {
    return checkDmsValue(value, attributes);
  }
  verifyValue = (value, attributes = this.attributes) => {
    return verifyDmsValue(value, attributes, this.required);
  }
}

const makeNewAttribute = (att, formats, props) => {
  if (att.type === "dms-format") {
    return new DmsAttribute(att, formats, props);
  }
  else if (att.type === "richtext") {
    return new EditorAttribute(att, props);
  }
  return new Attribute(att, props);
}

export const useDmsSections = (sections, value, onChange, props) => {

  const { registeredFormats } = useDms();

  const setValues = React.useCallback((k, v) => {
    onChange({ ...value, [k]: v });
  }, [value, onChange]);

  const [Sections, setSections] = React.useState([]);

  React.useEffect(() => {
    if (sections.length && !Sections.length) {
      const Sections = sections.map(({ title, attributes }, index) => {
        const section = {
          index,
          title,
          isActive: false,
          verified: false,
          attributes: attributes.map(att => makeNewAttribute(att, registeredFormats, props))
        }
        return section;
      })
      setSections(Sections);
    }
  }, [sections, Sections.length, registeredFormats, props]);

  return React.useMemo(() => {
    Sections.forEach(section => {
      section.attributes.forEach(att => {
        att.onChange = v => {
          setValues(att.key, v);
        }
      })
    })
    return Sections;
  }, [Sections, setValues]);
}
