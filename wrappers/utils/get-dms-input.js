import React from "react"

import {
  Input,
  TextArea,
  Select,
  ObjectInput,
  BooleanInput,
  MarkdownInput
} from "@availabs/avl-components"

import Editor, { createEmpty } from "../../components/editor"
import ReadOnlyEditor from "../../components/editor/editor.read-only"
import ImgInput from "../../components/img-input"
import DmsInput from "../../components/dms-input"
import ArrayInput from "../../components/array-input"
import OrderedArrayInput from "../../components/ordered-array-input"
import { getValue } from "../../utils"

import get from "lodash.get"

const makeDisplayComp = attribute => {
  return ({ value }) => {
    const comp = React.useMemo(() => getComp(value, attribute), [value]);
    return (
      <div>
        { comp }
      </div>
    )
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

const AvailableInputs = {
  $default: {
    InputComp: Input,
    getInputProps: (att, props) => ({ type: att.type }),
    getDisplayComp: (att, props) => null,
    getEmptyValueFunc: (att, props) => null
  },
  textarea: {
    InputComp: TextArea,
    getInputProps: (att, props) => ({}),
    getDisplayComp: (att, props) => null,
    getEmptyValueFunc: (att, props) => null
  },
  select: {
    InputComp: Select,
    getInputProps: (att, props) => {
      const inputProps = get(att, "inputProps", {});
      return {
        ...inputProps,
        domain: getDomain(att, props),
        multi: Boolean(att.isArray)
      }
    },
    getDisplayComp: (att, props) => null,
    getEmptyValueFunc: (att, props) => null
  },
  object: {
    InputComp: ObjectInput,
    getInputProps: (att, props) => ({}),
    getDisplayComp: (att, props) => null,
    getEmptyValueFunc: (att, props) => null
  },
  boolean: {
    InputComp: BooleanInput,
    getInputProps: (att, props) => ({}),
    getDisplayComp: (att, props) => null,
    getEmptyValueFunc: (att, props) => null
  },
  markdown: {
    InputComp: MarkdownInput,
    getInputProps: (att, props) => ({}),
    getDisplayComp: (att, props) => null,
    getEmptyValueFunc: (att, props) => null
  },
  richtext: {
    InputComp: Editor,
    getInputProps: (att, props) => ({ imgUploadUrl: get(props, "imgUploadUrl") }),
    getDisplayComp: (att, props) => EditorDisplayComp,
    getEmptyValueFunc: (att, props) => createEmpty
  },
  img: {
    InputComp: ImgInput,
    getInputProps: (att, props) => ({ imgUploadUrl: get(props, "imgUploadUrl") }),
    getDisplayComp: (att, props) => null,
    getEmptyValueFunc: (att, props) => null
  },
  "dms-format": {
    InputComp: DmsInput,
    getInputProps: (att, props) => ({ Attribute: att }),
    getDisplayComp: (att, props) => makeDisplayComp(att),
    getEmptyValueFunc: (att, props) => getEmptyFormatValue.bind(null, att, props)
  },
}

export const addInput = (type, inputData) => {
  AvailableInputs[type] = inputData;
}
const getInputData = type =>
  type in AvailableInputs ? AvailableInputs[type] : AvailableInputs["$default"];

const getDomain = (att, props) => {
  const domain = get(att, ["inputProps", "domain"], get(att, "domain", null));
  if (typeof domain === "string") {
    return getValue(domain, { props }) || [];
  }
  return domain;
}

const getComp = (value, att, i = null) => {
  if (!value) return null;

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
  return (
    <div key={ key }>
      { !name ? null :
        <span className="font-bold">{ name }: </span>
      }
      { value }
    </div>)
}

const EditorDisplayComp = ({ value }) =>
  <ReadOnlyEditor value={ value } isRaw={ false }/>;

export const getInput = (att, props, disabled) => {
  const { type, isArray } = att;

  let {
    InputComp,
    getInputProps,
    getDisplayComp,
    getEmptyValueFunc
  } = getInputData(type);

  let inputProps = getInputProps(att, props),
    DisplayComp = getDisplayComp(att, props),
    getEmptyValue = getEmptyValueFunc(att, props);

  // switch (type) {
  //   case "select":
  //     break;
  //   case "markdown":
  //     break;
  //   case "textarea":
  //     break;
  //   case "img":
  //     // inputProps = { imgUploadUrl: get(props, "imgUploadUrl") };
  //     break;
  //   case "richtext":
  //     // DisplayComp = EditorDisplayComp;
  //     // getEmptyValue = createEmpty;
  //     // inputProps = { imgUploadUrl: get(props, "imgUploadUrl") };
  //     break;
  //   case "object":
  //     break;
  //   case "dms-format":
  //     // inputProps = { Attribute: att };
  //     // getEmptyValue = getEmptyFormatValue.bind(null, att, props);
  //     // DisplayComp = makeDisplayComp(att);
  //     break;
  //   case "boolean":
  //     break;
  //   default:
  //     // InputComp = AvailableInputs["$default"];
  //     // inputProps = { type };
  //     break;
  // }
  if (isArray && (type !== "select")) {
    return React.forwardRef((props, ref) => (
      type === 'dms-format' ?
        <OrderedArrayInput
          { ...props }
          Input={ props.EditComp || InputComp }
          id={ att.id }
          inputProps={ inputProps }
          verifyValue={ att.verifyValue }
          hasValue={ att.checkHasValue }
          DisplayComp={ props.DisplayComp || DisplayComp } ref={ ref }
          getEmptyValue={ getEmptyValue }
          disabled={ disabled || (att.editable === false) }
        /> :
        <ArrayInput
          { ...props }
          Input={ props.EditComp || InputComp }
          id={ att.id }
          inputProps={ inputProps }
          verifyValue={ att.verifyValue }
          hasValue={ att.checkHasValue }
          DisplayComp={ props.DisplayComp || DisplayComp } ref={ ref }
          getEmptyValue={ getEmptyValue }
          disabled={ disabled || (att.editable === false) }
        />
    ))
  }
  return React.forwardRef((props, ref) => (
    <InputComp id={ att.id } { ...inputProps } { ...props } ref={ ref }
      disabled={ disabled || (att.editable === false) }/>
  ))
}
