import {
  createEditorState,
  convertToRaw
} from "../../components/editor"

import { getInput } from "./get-dms-input"

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
  constructor(setValues, format, item) {
    this.numSections = 0;
    this.activeSection = null;
    this.activeIndex = -1;

    this.storageId = makeStorageId(format, item);

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
        if (att.checkHasValue(values[att.key])) {
          att.initValue(values[att.key])
        }
      });
      setValues(prev => ({ ...prev, ...tempValues }));
      this.setValues = saved;
      this.initialized = initialized;
    }

    // this.msgIds = {};
    // this.setWarning = (type, warning) => {
    //   if (warning && !(type in this.msgIds)) {
    //     const msgId = dmsMsg.newMsgId();
    //     this.msgIds[type] = msgId;
    //     dmsMsg.sendPageMessage({ msg: warning, id: msgId });
    //   }
    //   else if (!warning && (type in this.msgIds)) {
    //     const msgId = this.msgIds[type];
    //     dmsMsg.removePageMessage([msgId]);
    //     delete this.msgIds[type];
    //   }
    // }
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
      // const msgIds = Object.values(this.msgIds);
      // if (msgIds.length) {
      //   dmsMsg.removePageMessage(msgIds);
      // }
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

    this.hasDefault = ("default" in att);
    this.defaultLoaded = false;
    this.defaultValue = undefined;

    this.onChange = (value, doLive = true) => {
      this.value = value;
      this.hasValue = this.checkHasValue(value);
      this.verified = this.verifyValue(value);
      // this.sendWarnings(value);
      this.doLiveUpdate = doLive && Boolean(this.liveUpdate);
      setValues(this.key, value);
    }


    // this.msgIds = {};
    this.hasWarning = false;
    // this.setWarning = (type, warning) => {
    //   if (warning && !(type in this.msgIds)) {
    //     const msgId = dmsMsg.newMsgId();
    //     this.msgIds[type] = msgId;
    //     if (typeof warning === "string") {
    //       warning = { msg: warning };
    //     }
    //     dmsMsg.sendAttributeMessage({ ...warning, id: msgId });
    //   }
    //   else if (!warning && (type in this.msgIds)) {
    //     const msgId = this.msgIds[type];
    //     dmsMsg.removeAttributeMessage([msgId]);
    //     delete this.msgIds[type];
    //   }
    //   this.hasWarning = Boolean(this.getWarnings().length);
    // }
    this.cleanup = () => {
      // const msgIds = Object.values(this.msgIds);
      // if (msgIds.length) {
      //   dmsMsg.removeAttributeMessage(msgIds);
      // }
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
  // sendWarnings = value => {
  //   if (!this.verified) {
  //     if (!this.hasValue && this.required) {
  //       this.setWarning("missing-data", `Missing value for required attribute: ${ this.name }.`);
  //       this.setWarning("invalid-data", null);
  //     }
  //     else {
  //       this.setWarning("invalid-data", `Invalid value for attribute: ${ this.name }.`);
  //       this.setWarning("missing-data", null);
  //     }
  //   }
  //   else {
  //     this.setWarning("invalid-data", null);
  //     this.setWarning("missing-data", null);
  //   }
  // };
  initValue = value => {
    if (this.isArray) {
      this.onChange(value || [], false);
    }
    else {
      // this.onChange(this.type === "boolean" ? Boolean(value) : value);
      this.onChange(value, false);
    }
  }
  // getWarnings = () => Object.values(this.msgIds);
}

class EditorAttribute extends Attribute {
  constructor(att, setValues, props) {
    super(att, setValues, props);

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
    }
  }
  checkHasValue = value => {
    if (Array.isArray(value)) {
      return value && value.reduce((a, c) => a || checkEditorValue(c), false);
    }
    return checkEditorValue(value);
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
  constructor(att, setValues, props) {
    super(att, setValues, props);

    const format = props.registeredFormats[att.format];
    this.Format = format;
    this.attributes = getAttributes(format, props.registeredFormats);

    this.value = this.isArray ? [] : {};

    this.defaultValue = undefined;//this.isArray ? [] : this.getDefault(props);
    this.hasDefault = false;//this.isArray ? false : Boolean(Object.keys(this.defaultValue).length);
    this.defaultLoaded = false;

    this.required = this.isArray ? this.required : isRequired(this.attributes);
  }
  clearValue() {
    super.clearValue();
    this.value = this.isArray ? [] : {};
    this.hasDefault = false;
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
    const defaults = this._getDefault(props, this.attributes);
    if ((this.defaultLoaded = checkDmsDefault(defaults)) === true) {
      this.defaultValue = defaults;
    };
    return defaults;
  }
  _getValue = (value, attributes) => {
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
  getValue = values => {
    if (Array.isArray(values)) {
      return values.map(v => this._getValue(v, this.attributes));
    }
    return this._getValue(values, this.attributes);
  }
  _initValue = (value, attributes) => {
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
      else {
        a[c.key] = get(value, c.key, c.isArray ? [] : undefined);
        // if (c.type === "boolean") {
        //   a[c.key] = Boolean(a[c.key]);
        // }
      }
      return a;
    }, {})
  }
  initValue = value => {
    this.onChange(
      this.isArray ? (value ? value.map(v => this._initValue(v, this.attributes)) : []) :
      this._initValue(value, this.attributes),
      false
    );
  }
  checkHasValue = (value, attributes = this.attributes) => {
    return checkDmsValue(value, attributes);
  }
  // cleanup = () => {
  //
  // }
  onSave = () => {

  }
  // _sendWarnings = (value, attributes, attTree) => {
  //   attributes.forEach(att => {
  //     const Value = get(value, att.key);
  //
  //     const missingKey = `missing-data-${ attTree.map(att => att.key).join("-") }-${ att.key }`,
  //       invalidKey = `invalid-data-${ attTree.map(att => att.key).join("-") }-${ att.key }`;
  //
  //     let missingMsg = null,
  //       invalidMsg = null;
  //
  //     if (att.isArray) {
  //        if (att.required && !(Value && Value.length)) {
  //          missingMsg = `Missing value for required attribute: ${ attTree.map(att => att.name).join(" -> ") } -> ${ att.name }.`;
  //        }
  //     }
  //     else if (att.type === "dms-format") {
  //       return this._sendWarnings(Value, att.attributes, [...attTree, att]);
  //     }
  //     else if (att.type === "richtext") {
  //       if (att.required && !checkEditorValue(Value)) {
  //         missingMsg = `Missing value for required attribute: ${ attTree.map(att => att.name).join(" -> ") } -> ${ att.name }.`;
  //       }
  //     }
  //     else {
  //       const _hasValue = hasValue(Value),
  //         verified = verifyValue(Value, att.type, att.verify);
  //       if (att.required && !_hasValue) {
  //         missingMsg = `Missing value for required attribute: ${ attTree.map(att => att.name).join(" -> ") } -> ${ att.name }.`;
  //       }
  //       else if (_hasValue && !verified) {
  //         invalidMsg = `Invalid value for attribute: ${ attTree.map(att => att.name).join(" -> ") } -> ${ att.name }.`;
  //       }
  //     }
  //     this.setWarning(missingKey, missingMsg);
  //     this.setWarning(invalidKey, invalidMsg);
  //   })
  // }
  // sendWarnings = value => {
  //   if (this.isArray) {
  //     if (this.required && !hasValue(value)) {
  //       this.setWarning(`missing-data-${ this.key }`, `Missing value for required attribute: ${ this.name }.`);
  //     }
  //     else {
  //       this.setWarning(`missing-data-${ this.key }`, null);
  //     }
  //     return;
  //   }
  //   this._sendWarnings(value, this.attributes, [this]);
  // }
  verifyValue = (value, attributes = this.attributes) => {
    return verifyDmsValue(value, attributes, this.required);
  }
}
export const makeNewAttribute = (att, setValues, props, mode) => {
  if (att.type === "dms-format") {
    return new DmsAttribute(att, setValues, props, mode);
  }
  else if (att.type === "richtext") {
    return new EditorAttribute(att, setValues, props, mode);
  }
  return new Attribute(att, setValues, props, mode);
}
