import React from "react"

import { Input, TextArea, Select, ObjectInput, BooleanInput, MarkdownInput } from "components/avl-components/components/Inputs"
import Editor, { createEmpty } from "../../components/editor"
import ReadOnlyEditor from "../../components/editor/editor.read-only"
import ImgInput from "../../components/img-input"
import DmsInput from "../../components/dms-input"
import ArrayInput from "../../components/array-input"

import { getValue } from "../../utils"

import get from "lodash.get"

const getDomain = (att, props) => {
  if (att.domain) {
    if (typeof att.domain === "string") {
      return getValue(att.domain, { props }) || [];
    }
    return att.domain;
  }
  return null;
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
        <ReadOnlyEditor value={ value } isRaw={ false }/>
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

const makeDisplayComp = attribute => {
  return ({ value }) => {
    const comp = React.useMemo(() => getComp(value, attribute), [value])
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
      a[c.key] = getValue(c.default, props);
    }
    return a;
  }, {})
}

const EditorDisplayComp = ({ value }) =>
  <ReadOnlyEditor value={ value } isRaw={ false }/>;

export const getInput = (att, props, disabled) => {
  let { type, isArray = false } = att,
    domain = getDomain(att, props);

  if (domain) {
    return props => (
      <Select { ...props } multi={ isArray } domain={ domain } id={ att.id }
        disabled={ disabled || (att.editable === false) }/>
    );
  }
  let InputComp = null, inputProps = {}, DisplayComp, getEmptyValue;

  switch (type) {
    case "markdown":
      InputComp = MarkdownInput;
      break;
    case "textarea":
      InputComp = TextArea;
      break;
    case "img":
      InputComp = ImgInput;
      break;
    case "richtext":
      InputComp = Editor;
      DisplayComp = EditorDisplayComp;
      getEmptyValue = createEmpty;
      break;
    case "object":
      InputComp = ObjectInput;
      break;
    case "dms-format":
      InputComp = DmsInput;
      inputProps = { Attribute: att };
      getEmptyValue = getEmptyFormatValue.bind(null, att, props);
      DisplayComp = att.isArray && makeDisplayComp(att);
      break;
    case "boolean":
      InputComp = BooleanInput;
      break;
    default:
      InputComp = Input;
      inputProps = { type };
      break;
  }
  if (isArray) {
    return React.forwardRef((props, ref) => (
      <ArrayInput Input={ InputComp } id={ att.id }
        { ...props } inputProps={ inputProps }
        verifyValue={ att.verifyValue }
        hasValue={ att.checkHasValue }
        DisplayComp={ DisplayComp } ref={ ref }
        getEmptyValue={ getEmptyValue }
        disabled={ disabled || (att.editable === false) }/>
    ))
  }
  return React.forwardRef((props, ref) => (
    <InputComp id={ att.id } { ...inputProps } { ...props } ref={ ref }
      disabled={ disabled || (att.editable === false) }/>
  ))
}
