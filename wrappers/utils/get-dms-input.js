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

const getComp = (value, att, i = null) => {
  if (!hasValue(value)) return null;

  const key = `${ att.key }${ i === null ? "" : `-${ i }` }`,
    name = i === null ? att.name : "";

  if (Array.isArray(value)) {
    return (
      <div key={ key }>
        <div className="font-bold">{ name }</div>
        { value.map((v, i) => getComp(v, att, i)) }
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
    return att.attributes.map(att => getComp(get(value, att.key), att))
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
  return (
    <div key={ key }>
      { !name ? null :
        <span className="font-bold">{ name }: </span>
      }
      { value }
    </div>
  )
}

const getDmsDisplayComp = attribute => {
  return ({ value }) => {
    const comp = React.useMemo(() => getComp(value, attribute), [value]);
    return comp;
  }
}
function getEmptyFormatValue(att, props) {
  return att.attributes.reduce((a, c) => {
    if (c.type === "dms-format") {
      a[c.key] = getEmptyFormatValue(c);
    }
    else if (c.type === "richtext") {
      a[c.key] = createEmpty();
    }
    else if ("default" in c) {
      a[c.key] = getValue(c.default, { props });
    }
    return a;
  }, {})
}

const EditorDisplayComp = ({ value }) =>
  <ReadOnlyEditor value={ value } isRaw={ false }/>;

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
      <div>{ att.name }: { value }</div>
    )
  }

const getDomain = (att, props) => {
  const domain = get(att, ["inputProps", "domain"], get(att, "domain", null));
  if (typeof domain === "string") {
    return getValue(domain, { props }) || [];
  }
  return domain;
}

const AvailableInputs = {
  $default: {
    InputComp: Input,
    getInputProps: (att, props) => {
      const { type, ...inputProps } = get(att, "inputProps", {});
      return {
        type: type || att.type,
        ...inputProps
      }
    },
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
    getDisplayComp: (att, props) => undefined,
    getEmptyValueFunc: (att, props) => undefined
  },
  object: {
    InputComp: ObjectInput,
    getInputProps: (att, props) => {
      return get(att, "inputProps", {});
    },
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
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
    getArrayProps: (att, props) => ({ showControls: true }),
    getDisplayComp: (att, props) => undefined,
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
const getInputData = type =>
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
    { CustomArrayInput, ...arrayProps} = getArrayProps(att, props),
    DisplayComp = getDisplayComp(att, props),
    getEmptyValue = getEmptyValueFunc(att, props);

  if (isArray && (type !== "select")) {
    return React.forwardRef((props, ref) => (
      CustomArrayInput ? (
        <CustomArrayInput
          { ...props } { ...arrayProps }
          Input={ props.EditComp || InputComp }
          id={ att.id }
          inputProps={ inputProps }
          verifyValue={ att.verifyValue }
          hasValue={ att.checkHasValue }
          DisplayComp={ props.DisplayComp || DisplayComp } ref={ ref }
          getEmptyValue={ getEmptyValue }
          disabled={ disabled || (att.editable === false) }/>
      ) : useOrdered ? (
        <OrderedArrayInput
          { ...props } { ...arrayProps }
          Input={ props.EditComp || InputComp }
          id={ att.id }
          inputProps={ inputProps }
          verifyValue={ att.verifyValue }
          hasValue={ att.checkHasValue }
          DisplayComp={ props.DisplayComp || DisplayComp } ref={ ref }
          getEmptyValue={ getEmptyValue }
          disabled={ disabled || (att.editable === false) }/>
      ) : (
        <ArrayInput
          { ...props }
          Input={ props.EditComp || InputComp }
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
    const Comp = props.EditComp || InputComp;
    return (
      <Comp id={ att.id } { ...inputProps } { ...props } ref={ ref }
        disabled={ disabled || (att.editable === false) }/>
      )
  })
}
