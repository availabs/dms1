import {
  createEditorState,
  convertToRaw
} from "../../components/editor"

import { getInput, getInputData } from "./get-dms-input"

import get from "lodash.get"

import { verifyValue, hasValue } from "@availabs/avl-components"
import {
  getValue,
  prettyKey,
  checkEditorValue,
  checkDmsValue,
  verifyDmsValue
} from "../../utils"


export const makeStorageId = (format = {}, item = null) =>
  `${ format.app }+${ format.type }${ item ? `:${ item.id }` : `` }`;

export class DmsCreateStateClass {
  constructor(setValues, format) {
    this.numSections = 0;
    this.activeSection = null;
    this.activeIndex = -1;

    this.data = {};

    this.verified = false;
    this.hasWarning = false;
    this.warnings = [];

    this.values = {};
    this.hasValues = false;
    this.defaultsLoaded = false;

    this.canGoNext = false;
    this.next = () => {};

    this.canGoPrev = false;
    this.prev = () => {};

    this.sections = [];
    this.attributes = [];
    this.badAttributes = [];
    this.ignoredAttributes = [];

    this.doLiveUpdate = false;

    this.saveValues = {};

    this.setValues = (key, value) => {
      setValues(prev => ({ ...prev, [key]: value }));
    }
    this.mapOldToNew = (oldKey, newKey, value) => {
      this.ignoredAttributes.push(oldKey);
      const att = this.attributes.find(d => d.key === newKey);
      att.onChange(att.mapOldToNew(value), false);
    };
    this.deleteOld = oldKey => {
      this.ignoredAttributes.push(oldKey);
      setValues(prev => ({ ...prev }));
    };
    this.initialized = false;
    this.initValues = (values, initialized = true) => {
      const saved = this.setValues,
        tempValues = {};
      this.setValues = (key, value) => {
        tempValues[key] = value;
      }
      this.attributes.forEach(att => {
        if (att.checkHasValue(values[att.key], true)) {
          att.initValue(values[att.key])
        }
      });
      setValues(prev => ({ ...prev, ...tempValues }));
      this.setValues = saved;
      this.initialized = initialized;
    }

    this.clearValues = () => {
      this.attributes.forEach(att => {
        att.clearValue();
      });
      setValues({});
      this.initialized = false;
      this.values = {};
      this.saveValues = {};
      this.verified = false;
      this.hasValues = false;
      this.defaultsLoaded = false;
      window.localStorage.removeItem(this.storageId);
    };
    this.cleanup = () => {
      this.sections.forEach(section =>
        section.attributes.forEach(att => att.cleanup())
      );
    }
  }
  getValues = values => {
    return this.attributes.reduce((a, c) => {
      const value = get(values, c.key);
      if (c.checkHasValue(value)) {
        a[c.key] = c.getValue(value);
      }
      return a;
    }, {})
  }
  onSave = () => {
    this.sections.forEach(section =>
      section.attributes.forEach(att => att.onSave())
    );
  }
}

class Attribute {
  constructor(att, setValues, props, mode) {
    Object.assign(this, att);

    this.mode = mode;

    this.name = this.name || prettyKey(this.key);
    this.Input = getInput(this, props);

    this.hidden = Boolean(getValue(att.hidden, { props }));

    const editable = getValue(att.editable, { props });
    switch (editable) {
      case "before-create":
        this.editable = (mode === "create");
        break;
      case "after-create":
        this.editable = (mode === "edit");
        break;
      default:
        this.editable = editable !== false;
        break;
    }

    this.value = this.isArray ? [] : undefined;
    this.hasValue = false;
    this.verified = !this.required;

    this.hasDefault = !this.isArray && ("default" in att);
    this.defaultLoaded = false;
    this.defaultValue = undefined;

    this.setValues = setValues;

    this.onChange = (value, doLive = true) => {
      this.value = (typeof value === "function") ? value(this.value) : value;
      this.hasValue = this.checkHasValue(this.value);
      this.verified = this.verifyValue(this.value);
      this.doLiveUpdate = doLive && Boolean(this.liveUpdate);
      if (typeof this.setValues === "function") {
        this.setValues(this.key, this.value, doLive);
      }
    }

    this.hasWarning = false;
    this.cleanup = () => {
    }
    this.onSave = () => {

    }
  }
  clearValue() {
    this.value = this.isArray ? [] : undefined;
    this.hasValue = false;
    this.verified = !this.required;

    this.defaultLoaded = false;
    this.defaultValue = undefined;
  }
  mapOldToNew = value => value;

  getDefault = props => {
    this.defaultValue = getValue(this.default, { props });
    this.defaultLoaded = this.checkHasValue(this.defaultValue);
    return this.defaultValue;
  }
  getValue = value => value;
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
  initValue = value => {
    if (this.isArray) {
      this.onChange(value || [], false);
    }
    else {
      // this.onChange(this.type === "boolean" ? Boolean(value) : value);
      this.onChange(value, false);
    }
  }
}

class EditorAttribute extends Attribute {
  constructor(att, setValues, props, mode) {
    super(att, setValues, props, mode);

    this.hasDefault = false;
    this.value = this.isArray ? [] : createEditorState(undefined);
  }

  clearValue() {
    super.clearValue();
    this.hasDefault = false;
    this.value = this.isArray ? [] : createEditorState(undefined);
  }
  mapOldToNew = value => {
    if (Array.isArray(value)) {
      return value.map(createEditorState);
    }
    return createEditorState(value);
  };

  getValue = value => {
    if (Array.isArray(value)) {
      return value.map(v => convertToRaw(v.getCurrentContent()));
    }
    return convertToRaw(value.getCurrentContent());
  }
  initValue = value => {
    if (this.isArray) {
      this.onChange(value ? value.map(createEditorState) : [], false);
    }
    else {
      this.onChange(createEditorState(value), false);
// console.log("<EditorAttribute>", value, this)
    }
  }
  checkHasValue = (value, isRaw = false) => {
    let valueToCheck = value;
    if (isRaw) {
      if (Array.isArray(value)) {
        valueToCheck = value.map(createEditorState);
      }
      else {
        valueToCheck = createEditorState(value);
      }
    }

    if (Array.isArray(valueToCheck)) {
      return valueToCheck.reduce((a, c) => a || checkEditorValue(c), false);
    }
    return checkEditorValue(valueToCheck);
  }
  verifyValue = value => {
    return !this.required || this.checkHasValue(value);
  }
}

export const isRequired = attributes => {
  return attributes.reduce((a, c) => {
    if (c.type === "dms-format") {
      return a || isRequired(c.attributes);
    }
    return a || c.required;
  }, false)
}

export const getAttributes = (format, formats) => {
  const attributes = [];
  format.attributes.forEach(att => {
    const Att = Object.assign({}, att);
    Att.name = att.name || prettyKey(att.key);
    if (Att.type === "dms-format") {
      Att.attributes = getAttributes(formats[Att.format], formats);
    }
    attributes.push(Att);
  })
  return attributes;
}

const checkDmsDefault = defaults =>
  Object.keys(defaults).reduce((a, c) => {
    if (typeof defaults[c] === "object") {
      return a && checkDmsDefault(defaults[c]);
    }
    return a && hasValue(defaults[c]);
  }, true)

class DmsAttribute extends Attribute {
  constructor(att, setValues, props, mode) {
    super(att, setValues, props, mode);

    const format = props.registeredFormats[att.format];
    this.Format = format;
    this.attributes = getAttributes(format, props.registeredFormats);

    this.value = this.isArray ? [] : {};

    this.Attributes = this.attributes.map(att => makeNewAttribute(att, null, props, mode));

    this.defaultValue = undefined;
    this.hasDefault = !this.isArray && this.Attributes.reduce((a, c) => a || c.hasDefault, false);
    this.defaultLoaded = false;

    this.required = this.required || isRequired(this.attributes);
    this.verified = !this.required;
  }
  clearValue() {
    super.clearValue();
    this.value = this.isArray ? [] : {};
    this.verified = !this.required;
    // this.hasDefault = this.Attributes.reduce((a, c) => a || c.hasDefault, false);;
    this.defaultValue = undefined;
    this.defaultLoaded = false;
  }
  _mapOldToNew = (value, attributes) => {
    return attributes.reduce((a, c) => {
      const Value = get(value, c.key),
        length = get(Value, "length", 0);
      if (c.type === "dms-format") {
        if (c.isArray && length) {
          a[c.key] = Value.map(v => this._mapOldToNew(v, c.attributes));
        }
        else if (checkDmsValue(Value, c.attributes)) {
          a[c.key] = this._mapOldToNew(Value, c.attributes);
        }
      }
      else if (c.type === "richtext") {
        if (c.isArray && length) {
          a[c.key] = Value.map(createEditorState)
        }
        else {
          a[c.key] = createEditorState(Value);
        }
      }
      else {
        a[c.key] = Value;
      }
      return a;
    }, {});
  };
  mapOldToNew = value => {
    if (Array.isArray(value)) {
      return value.map(v => this._mapOldToNew(v, this.attributes));
    }
    return this._mapOldToNew(value, this.attributes);
  };
  _getDefault = (props, attributes) => {
    return attributes.reduce((a, c) => {
      if (c.type === "dms-format") {
        const defaults = this._getDefault(props, c.attributes);
        if (Object.keys(defaults).length) {
          a[c.key] = defaults;
        }
      }
      else if (("default" in c) && (c.type !== "richtext")) {
        a[c.key] = getValue(c.default, { props });
      }
      return a;
    }, {})
  }
  getDefault = props => {
    // if (this.isArray) {
    //   return [];
    // }
    this.defaultValue = this.Attributes.reduce((a, c) => {
      if (c.hasDefault) {
        a[c.key] = c.getDefault(props);
      }
      return a;
    }, {});
    this.defaultLoaded = this.checkHasValue(this.defaultValue);
    return this.defaultValue;

    // const defaults = this._getDefault(props, this.attributes);
    // if ((this.defaultLoaded = checkDmsDefault(defaults)) === true) {
    //   this.defaultValue = defaults;
    // };
    // return defaults;
  }
  _getValueOld = (value, attributes) => {
    return attributes.reduce((a, c) => {
      const Value = get(value, c.key),
        length = get(Value, "length", 0);
      if (c.type === "dms-format") {
        if (c.isArray && length) {
          a[c.key] = Value.map(v => this._getValue(v, c.attributes))
        }
        else if (checkDmsValue(Value, c.attributes)) {
          a[c.key] = this._getValue(Value, c.attributes);
        }
      }
      else if (c.type === "richtext") {
        if (c.isArray && length) {
          a[c.key] = Value.map(v => convertToRaw(v.getCurrentContent()));
        }
        else if (checkEditorValue(Value)) {
          a[c.key] = convertToRaw(Value.getCurrentContent());
        }
      }
      else if (hasValue(Value)) {
        a[c.key] = Value;
      }
      return a;
    }, {});
  }
  _getValue = value => {
    return this.Attributes.reduce((a, c) => {
      if (c.checkHasValue(value[c.key])) {
        a[c.key] = c.getValue(value[c.key]);
      }
      return a;
    }, {});
  }
  getValue = values => {
    if (Array.isArray(values)) {
      return values.map(value => this._getValue(value));
    }
    return this._getValue(values);

    // if (Array.isArray(values)) {
    //   return values.map(v => this._getValue(v, this.attributes));
    // }
    // return this._getValue(values, this.attributes);
  }
  _initValueOld = (value, attributes) => {
    return attributes.reduce((a, c) => {
      if (c.type === "dms-format") {
        a[c.key] = c.isArray ?
          get(value, c.key, []).map(v => this._initValue(v, c.attributes)) :
          this._initValue(get(value, c.key, {}), c.attributes);
      }
      else if (c.type === "richtext") {
        a[c.key] = c.isArray ?
          get(value, c.key, []).map(createEditorState) :
          createEditorState(get(value, c.key));
      }
      else if (c.type === "type-select") {
        a[c.key] = get(value, c.key, c.isArray ? [] : undefined);
      }
      else {
        a[c.key] = get(value, c.key, c.isArray ? [] : undefined);
        // if (c.type === "boolean") {
        //   a[c.key] = Boolean(a[c.key]);
        // }
      }
      return a;
    }, {})
  }
  _initValue = value => {
    return this.Attributes.reduce((a, att) => {
      const setValues = (key, value) => {
        a[key] = value;
      };
      att.setValues = setValues;
      att.initValue(get(value, att.key));
      return a;
    }, {});
  }
  initValue = value => {
    this.onChange(
      Array.isArray(value) ?
        value.map(v => this._initValue(v)) :
        this._initValue(value)
    )
    // this.onChange(
    //   this.isArray ? (value ? value.map(v => this._initValue(v, this.attributes)) : []) :
    //   this._initValue(value, this.attributes),
    //   false
    // );
  }
  _checkHasValue = (value, isRaw) => {
    return this.Attributes.reduce((a, c) => {
      return a || c.checkHasValue(value[c.key], isRaw);
    }, false);
  }
  checkHasValue = (value, isRaw = false, attributes = this.attributes) => {
    if (!hasValue(value)) return false;

    if (Array.isArray(value)) {
      return value.reduce((a, c) => a || this._checkHasValue(c, isRaw));
    }
    return this._checkHasValue(value, isRaw);
    // return checkDmsValue(value, attributes, isRaw);
  }
  onSave = () => {

  }
  _verifyValue = value => {
    return !hasValue(value) ? !this.required : this.Attributes.reduce((a, c) => {
      return a && c.verifyValue(value[c.key]);
    }, true);
  }
  verifyValue = (value, attributes = this.attributes) => {
    if (Array.isArray(value)) {
      return value.reduce((a, c) => {
        return a && this._verifyValue(c);
      }, this.required ? Boolean(value.length) : true)
    }
    return this._verifyValue(value);
    // return verifyDmsValue(value, attributes, this.required);
  }
}

export const getTypeAttributes = (attributes, formats) => {
  const Attributes = [];
  attributes.forEach(att => {
    const Att = Object.assign({}, att);
    Att.name = att.name || prettyKey(att.key);
    if (Att.type === "dms-format") {
      Att.attributes = getAttributes(formats[Att.format], formats);
    }
    Attributes.push(Att);
  })
  return Attributes;
}

export class TypeSelectAttribute extends Attribute {
  constructor(att, setValues, props, mode) {
    super(att, setValues, props, mode);

    this.isArray = false;

//     const setAttValue = (key, value, doLive = true) => {
// console.log("SET ATT VALUE:", key, value)
//       this.value = { ...this.value, key, value };
//       const Attribute = this.getAtrribute(key);
//       this.hasValue = Attribute.checkHasValue(value);
//       this.verified = Attribute.verifyValue(value);
//       this.doLiveUpdate = doLive && Boolean(this.liveUpdate);
//       this.setValues(this.key, this.value);
//     }

    this.Attributes = att.attributes.map(att => makeNewAttribute(att, null, props, mode));
// console.log("<TypeSelectAttribute>", this)

    this.onChange = (changeValue, doLive = true) => {
      changeValue = changeValue || {};

      let { key, name, type, value } = changeValue;

      if (key && !hasValue(value)) {
        const Attribute = this.getAtrribute(key);
        const saved = Attribute.setValues;
        Attribute.setValues = (k, v) => {
          value = v;
        }
        Attribute.initValue(value);
        Attribute.setValues = saved;
      }

      this.value = { key, name, type, value };
      this.hasValue = this.checkHasValue(this.value);
      this.verified = this.verifyValue(this.value);
      this.doLiveUpdate = doLive && Boolean(this.liveUpdate);

      this.setValues(this.key, this.value, doLive);
    }

    this.value = this.isArray ? [] : {};
    this.hasValue = false;
    this.verified = !this.required;

    this.hasDefault = false;//("default" in att);
    this.defaultLoaded = false;
    this.defaultValue = undefined;

    this.initValue = initValue => {
      let { key, value, type, name } = initValue || {};
      const Attribute = this.getAtrribute(key);
      Attribute.setValues = (k, v) => {
        value = v;
      }
      Attribute.initValue(value);
      this.onChange({ key, value, type, name }, false);
    }

    this.mapOldToNew = oldValue => {
      // if (typeof oldValue !== "object") return undefined;
      //
      // let { attribute, value } = oldValue || {};
      //
      // const initValue = (key, newValue) => {
      //   value = newValue;
      // }
      //
      // let SelectedAttribute = null;
      // const Attribute = this.Attributes.reduce((a, c) => c.key === attribute ? c : a, null);
      // if (Attribute) {
      //   SelectedAttribute = makeNewAttribute(Attribute, initValue, props, mode);
      // }
      // if (value) {
      //   SelectedAttribute.initValue(value);
      // }
      // return { attribute, value };
    };

    this.hasWarning = false;
    this.cleanup = () => {

    }
    this.onSave = () => {

    }
  }
  getAtrribute(key) {
    return this.Attributes.reduce((a, c) => {
      return c.key === key ? c : a;
    }, null)
  }
  clearValue() {
    this.value = this.isArray ? [] : {};
    this.hasValue = false;
    this.verified = !this.required;

    this.hasDefault = false;
    this.defaultLoaded = false;
    this.defaultValue = undefined;
  }

  getDefault = props => {
    this.defaultValue = undefined;//getValue(this.default, { props });
    this.defaultLoaded = false;//this.checkHasValue(this.defaultValue);
    return this.defaultValue;
  }

  getValue = fromValue => {
    const { key, type, name, value } = fromValue;
    const Attribute = this.getAtrribute(key);
    return {
      key, type, name,
      value: Attribute ? Attribute.getValue(value) : undefined
    }
  };

  checkHasValue = (checkValue, isRaw = false) => {
// console.log("<TypeSelectAttribute::checkHasValue>", this, checkValue);
    const { value, key } = checkValue || {};
    const Attribute = this.getAtrribute(key);
    if (Attribute) {
      return Attribute.checkHasValue(value, isRaw);
    }
    else {
      return hasValue(value);
    }
  }
  verifyValue = verifyValue => {
    if (verifyValue) {
      const { value, key } = verifyValue;
      const Attribute = this.getAtrribute(key);
      if (Attribute) {
        return Attribute.verifyValue(value);
      }
    }
    return !this.required;
  }
  initValue = value => {
    this.onChange(value);
  }
}

export const makeNewAttribute = (att, setValues, props, mode) => {
  if (att.type === "dms-format") {
    return new DmsAttribute(att, setValues, props, mode);
  }
  else if (att.type === "richtext") {
    return new EditorAttribute(att, setValues, props, mode);
  }
  else if (att.type === "type-select") {
    return new TypeSelectAttribute(att, setValues, props, mode);
  }
  return new Attribute(att, setValues, props, mode);
}
