import React from "react"

import {
  Input,
  TextArea,
  Select,
  ObjectInput,
  BooleanInput,
  MarkdownInput,
  MarkdownViewer,
  ColorInput,
  hasValue
} from "@availabs/avl-components"

import Editor, { createEmpty } from "../../components/editor"
import ReadOnlyEditor from "../../components/editor/editor.read-only"
import ImgInput from "../../components/img-input"
import DmsInput from "../../components/dms-input"
import ArrayInput from "../../components/array-input"
import OrderedArrayInput from "../../components/ordered-array-input"
import TypeSelect from "../../components/type-select"
import { getValue } from "../../utils"

import get from "lodash.get"

export const getDisplayComp = (value, att, i = null) => {
  if (!hasValue(value)) return null;

  const key = `${ att.key }${ i === null ? "" : `-${ i }` }`,
    name = i === null ? att.name : "";

  if (Array.isArray(value)) {
    return (
      <div key={ key }>
        <div className="font-bold">{ name }</div>
        { value.map((v, i) => getDisplayComp(v, att, i)) }
      </div>
    )
  }
  if (att.type === "richtext") {
    if (!value.getCurrentContent().hasText()) return null;
    return (
      <div key={ key }>
        <div className="font-bold">{ name }</div>
        <ReadOnlyEditor key={ att.key } value={ value } isRaw={ false }/>
      </div>
    )
  }
  else if (att.type === "dms-format") {
// console.log("<getDisplayComp> dms-format", att);
    return att.Attributes.map(att => getDisplayComp(get(value, att.key), att))
  }
  else if (att.type === "img") {
    return (
      <div key={ key }>
        { !name ? null :
          <span className="font-bold">{ name }: </span>
        }
        <img src={ value.url } alt={ value.filename }/>
      </div>
    )
  }
  else if (att.type === "type-select") {
    if (!value) return null;
// console.log("<getDisplayComp> type-select", att, value)
    return getDisplayComp(value.value, att.Attributes.reduce((a, c) => c.key === value.key ? c : a, null), i);
  }
  return (
    <div key={ key }>
      { !name ? null :
        <span className="font-bold">{ name }: </span>
      }
      { `${ value }` }
    </div>
  )
}

const getDmsDisplayComp = attribute => {
  return ({ value }) => {
    const comp = React.useMemo(() => getDisplayComp(value, attribute), [value]);
    return comp;
  }
}
export function getEmptyFormatValue(att, props) {
// console.log("<getEmptyFormatValue>", att)
  return att.attributes.reduce((a, c) => {
    if (c.type === "dms-format") {
      a[c.key] = getEmptyFormatValue(c);
    }
    else if (c.type === "richtext") {
      a[c.key] = createEmpty();
    }
    else if ("default" in c) {
// console.log("GETTING DEFAULT:", c, getValue(c.default, { props }))
      a[c.key] = getValue(c.default, { props });
    }
    return c.isArray ? { ...a, [c.key]: [] } : a;
  }, {});
}

const EditorDisplayComp = ({ value, isRaw = false }) =>
  <ReadOnlyEditor value={ value } isRaw={ isRaw }/>;

const ColorDisplayComp = ({ value }) =>
  <div className="w-full h-full flex items-center justify-center"
    style={ { backgroundColor: value } }/>

const ImgDisplayComp = ({ value }) => {
  return (
    <img src={ value.url } alt={ value.filename }/>
  )
}

const getBooleanDisplay = att =>
  ({ value }) => {
    return (
      <div>{ att.name }: { `${ value }` }</div>
    )
  }

const getDomain = (att, props) => {
  const domain = get(att, ["inputProps", "domain"], get(att, "domain", null));
  if (typeof domain === "string") {
    return getValue(domain, { props }) || [];
  }
  return domain;
}

let DefaultArrayProps = {
  CreateButton: undefined,
  DisplayControls: undefined,
  EditComponent: undefined,
  CustomArrayInput: undefined
}
export const setDefaultArrayProps = (key, value) => {
  if (typeof key === "object") {
    DefaultArrayProps = { ...DefaultArrayProps, ...key };
  }
  else {
    DefaultArrayProps[key] = value;
  }
}

export const AvailableInputs = {
  $default: {
    InputComp: Input,
    getInputProps: (att, props) => {
      const { type, ...inputProps } = get(att, "inputProps", {});
      return {
        type: type || att.type,
        ...inputProps
      }
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", undefined);
    },
    getEmptyValueFunc: (att, props) => undefined
  },
  color: {
    InputComp: ColorInput,
    getInputProps: (att, props) => {
      return get(att, "inputProps", {});
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", ColorDisplayComp);
    },
    getEmptyValueFunc: (att, props) => undefined
  },
  textarea: {
    InputComp: TextArea,
    getInputProps: (att, props) => {
      return get(att, "inputProps", {});
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", undefined);
    },
    getEmptyValueFunc: (att, props) => undefined
  },
  select: {
    InputComp: Select,
    getInputProps: (att, props) => {
      const inputProps = get(att, "inputProps", {});
      return {
        ...inputProps,
        domain: getDomain(att, props),
        multi: get(inputProps, "multi", Boolean(att.isArray))
      }
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => undefined,
    getEmptyValueFunc: (att, props) => undefined
  },
  object: {
    InputComp: ObjectInput,
    getInputProps: (att, props) => {
      return get(att, "inputProps", {});
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", undefined);
    },
    getEmptyValueFunc: (att, props) => ({})
  },
  boolean: {
    InputComp: BooleanInput,
    getInputProps: (att, props) => {
      return get(att, "inputProps", {});
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", getBooleanDisplay(att));
    },
    getEmptyValueFunc: (att, props) => undefined
  },
  markdown: {
    InputComp: MarkdownInput,
    getInputProps: (att, props) => {
      return get(att, "inputProps", {});
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", MarkdownViewer);
    },
    getEmptyValueFunc: (att, props) => undefined
  },
  richtext: {
    InputComp: Editor,
    getInputProps: (att, props) => {
      const { imgUploadUrl, ...inputProps } = get(att, "inputProps", {});
      return {
        ...inputProps,
        imgUploadUrl: imgUploadUrl || get(props, "imgUploadUrl")
      }
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", EditorDisplayComp);
    },
    getEmptyValueFunc: (att, props) => createEmpty
  },
  img: {
    InputComp: ImgInput,
    getInputProps: (att, props) => {
      const { imgUploadUrl, ...inputProps } = get(att, "inputProps", {});
      return {
        ...inputProps,
        imgUploadUrl: imgUploadUrl || get(props, "imgUploadUrl")
      }
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", ImgDisplayComp);
    },
    getEmptyValueFunc: (att, props) => undefined
  },
  "dms-format": {
    InputComp: DmsInput,
    getInputProps: (att, props) => {
      const inputProps = get(att, "inputProps", {});
      return {
        ...inputProps,
        Attribute: att
      }
    },
    getArrayProps: (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", getDmsDisplayComp(att));
    },
    getEmptyValueFunc: (att, props) => getEmptyFormatValue.bind(null, att, props)
  },
  "type-select": {
    InputComp: TypeSelect,
    getInputProps: (att, props) => {
      const inputProps = get(att, "inputProps", {});
      return {
        ...inputProps,
        Attribute: att
      }
    },
    getArrayProps: (att, props) => (att, props) => get(att, "arrayProps", {}),
    getDisplayComp: (att, props) => {
      return get(att, "DisplayComp", getDmsDisplayComp(att));
    },
    getEmptyValueFunc: (att, props) => undefined
  }
}

export const addInput = (type, inputData) => {
  const defaultData = get(AvailableInputs, type, {});
  AvailableInputs[type] = {
    ...defaultData,
    ...inputData
  };
}
export const getInputData = type =>
  get(AvailableInputs, type, AvailableInputs["$default"]);

export const getInput = (att, props, disabled) => {
  const { type, isArray, useOrdered } = att;

  const {
    InputComp,
    getInputProps,
    getArrayProps,
    getDisplayComp,
    getEmptyValueFunc
  } = getInputData(type);


  const inputProps = getInputProps(att, props),
    { CustomArrayInput, ...arrayProps } = { ...DefaultArrayProps, ...getArrayProps(att, props) },
    DisplayComp = getDisplayComp(att, props),
    getEmptyValue = getEmptyValueFunc(att, props);

  if (isArray && (type !== "select")) {
    return React.forwardRef((props, ref) => (
      CustomArrayInput ? (
        <CustomArrayInput Input={ InputComp }
          { ...arrayProps } { ...props }
          id={ att.id }
          inputProps={ inputProps }
          verifyValue={ att.verifyValue }
          hasValue={ att.checkHasValue }
          DisplayComp={ props.DisplayComp || DisplayComp } ref={ ref }
          getEmptyValue={ getEmptyValue }
          disabled={ disabled || (att.editable === false) }/>
      ) : useOrdered ? (
        <OrderedArrayInput Input={ InputComp }
          { ...arrayProps } { ...props }
          id={ att.id }
          inputProps={ inputProps }
          verifyValue={ att.verifyValue }
          hasValue={ att.checkHasValue }
          DisplayComp={ props.DisplayComp || DisplayComp } ref={ ref }
          getEmptyValue={ getEmptyValue }
          disabled={ disabled || (att.editable === false) }/>
      ) : (
        <ArrayInput Input={ InputComp } { ...props }
          id={ att.id }
          inputProps={ inputProps }
          verifyValue={ att.verifyValue }
          hasValue={ att.checkHasValue }
          DisplayComp={ props.DisplayComp || DisplayComp } ref={ ref }
          getEmptyValue={ getEmptyValue }
          disabled={ disabled || (att.editable === false) }/>
      )
    ))
  }

  return React.forwardRef((props, ref) => {
    const Comp = props.Input || InputComp;
    return (
      <Comp id={ att.id } { ...inputProps } { ...props } ref={ ref }
        disabled={ disabled || (att.editable === false) }/>
      )
  })
}
