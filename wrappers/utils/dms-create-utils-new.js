import get from "lodash.get"

import {
  createEditorState,
  convertToRaw
} from "../../components/editor"

import { getInput, getInputData } from "./get-dms-input"

import { verifyValue, hasValue } from "modules/avl-components/src"
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
  constructor(setValues, format, itemId) {
    this.numSections = 0;
    this.activeSection = null;
    this.activeSectionIndex = 0;

    this.verified = false;

    this.values = {};
    this.saveValues = {};
    this.hasValues = false;
    this.hasDefaults = false;
    this.defaultsLoaded = true;

    this.propsLoaded = false;
    this.initialized = false;

    this.storageId = makeStorageId(format, itemId);

    this.canGoNext = false;
    this.next = () => {};

    this.canGoPrev = false;
    this.prev = () => {};

    this.Sections = [];
    this.Attributes = [];

    this.doLiveUpdate = false;

    this.setValues = setValues;
  }

  onChange(value) {
    this.values = (value === "function") ? value(this.values) : { ...this.values, ...value };

    this.timestamp = performance.now();

    this.hasValue = this.checkHasValues();
    this.verified = this.verifyValues();

    this.setValues(this.values);
  }
  getSaveValues() {
    return this.attributes.reduce((a, c) => {
      const value = get(this.values, c.key);
      if (c.checkHasValue(value)) {
        a[c.key] = c.getSaveValue(value);
      }
      return a;
    }, {})
  }

  initValues(values) {
    const tempValues = {};
    const setValues = (key, value) => {
      tempValues[key] = value;
    }
    this.initialized = Boolean(this.Attributes.length) && hasValue(values);

    this.Attributes.forEach(att => {
      att.setValues = setValues;
      if (att.checkHasValue(values[att.key], true)) {
        att.initValue(values[att.key])
      }
      att.setValues = this.setValues;
      this.initialized = this.initialized && att.initialized;
    });
    this.setValues(prev => ({ ...prev, ...tempValues }));
  }
  loadDefaultValues(props) {
    const defaultValues = this.Attributes.reduce((a, c) => {
      a[c.key] = c.getDefaultValue(props);
      return a;
    }, {});
    this.initValues(defaultValues);
  }

  clearValues() {
    this.attributes.forEach(att => {
      att.clearValue();
    });
    this.setValues({});
    this.initialized = false;
    this.values = {};
    this.saveValues = {};
    this.verified = false;
    this.hasValues = false;
    this.defaultsLoaded = false;
    window.localStorage.removeItem(this.storageId);
  };
}

class Attribute {
  constructor(att, props, mode) {
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

    this.hasDefault = ("default" in att);
    this.defaultLoaded = !this.hasDefault;
    this.defaultValue = undefined;

    this.setValues = null;
  }

  onChange(value, doLive = true) {
    this.value = (typeof value === "function") ? value(this.value) : value;

    this.hasValue = this.checkHasValue(this.value);
    this.verified = this.verifyValue(this.value);

    this.doLiveUpdate = doLive && Boolean(this.liveUpdate);

    this.timestamp = performance.now();

    if (typeof this.setValues === "function") {
      this.setValues({ [this.key]: this.value }, doLive);
    }
  }
  clearValue() {
    this.value = this.isArray ? [] : undefined;
    this.hasValue = false;
    this.verified = !this.required;

    this.defaultLoaded = false;
    this.defaultValue = undefined;
  }

  generateDefaultValue(props) {
    return getValue(this.default, { props });
  }
  loadDefaultValue(props) {
    let defaultValue = this.isArray ? [] : undefined;
    this.defaultLoaded = true;
    if (this.hasDefault) {
      defaultValue = this.isArray ? [] : this.generateDefaultValue(props);
      this.defaultLoaded = this.checkHasValue(defaultValue);
    }
    this.initValue(defaultValue);
  }

  getSaveValue(value) { return value; }

  checkHasValue(value) {
    if (Array.isArray(value)) {
      return value && value.reduce((a, c) => a || hasValue(c), false)
    }
    return hasValue(value);
  }
  verifyValue(value) {
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
  initValue(value) {
    this.onChange(this.isArray ? (value || []) : value, false);
  }
}
