import React from "react"

import get from "lodash.get"
import * as d3format from "d3-format"
import * as d3timeFormat from "d3-time-format"

import { hasValue, verifyValue } from "components/avl-components/components/Inputs/utils"

export const checkEditorValue = value => Boolean(value) && value.getCurrentContent().hasText();

export const checkDmsValue = (value, attributes) => {
  if (!hasValue(value)) return false;

  if (Array.isArray(value)) {
    return value.reduce((a, c) => a || checkDmsValue(c, attributes), false)
  }

  return attributes.reduce((a, c) => {
    if (a === true) return true;

    const Value = get(value, c.key);
    if (c.type === "dms-format") {
      return checkDmsValue(Value, c.attributes);
    }
    else if (c.type === "richtext") {
      if (Array.isArray(Value)) {
        return Value.reduce((a, c) => a || c.getCurrentContent().hasText(), false);
      }
      return Boolean(Value) && Value.getCurrentContent().hasText();
    }
    else if (Array.isArray(Value)) {
      return Value.reduce((a, c) => a || hasValue(c), false);
    }
    return hasValue(Value);
  }, false)
}
export const verifyDmsValue = (value, attributes, required = false) => {
  if (!hasValue(value)) return !required;

  if (Array.isArray(value)) {
    return value.reduce((a, c) => a && verifyDmsValue(c, attributes), true);
  }
  return attributes.reduce((a, c) => {
    const Value = get(value, c.key);

    if (c.type === "dms-format") {
      return a && verifyDmsValue(Value, c.attributes);
    }
    else if (c.type === "richtext") {
      if (!c.required) return a;

      if (Array.isArray(Value)) {
        return a && Value.reduce((a, c) => a && c.getCurrentContent().hasText, true);
      }
      return a && (Boolean(Value) && Value.getCurrentContent().hasText())   ;
    }
    else if (Array.isArray(Value)) {
      return a && (Value.length ?
        Value.reduce((aa, cc) => aa && verifyValue(cc, c.type, c.verify)) : !c.required
      )
    }
    return a && (hasValue(value[c.key]) ?
      verifyValue(value[c.key], c.type, c.verify) : !c.required
    );
  }, true)
}

export const processAction = action => {
  let response = {
    action: "unknown",
    seedProps: () => null,
    showConfirm: false,
    label: null,
    buttonTheme: null,
    disabled: false,
    then: null,
    doThen: () => Promise.resolve()
  };
  if (typeof action === "string") {
    response.action = action;
  }
  else {
    response = { ...response, ...action };
  }
  if (typeof response.seedProps === "object") {
    const map = { ...response.seedProps };
    response.seedProps = (props, self) => mapDataToProps(map, { props, self });
  }
  const { then, ...processed } = response;
  if (typeof then === "function") {
    processed.doThen = () => Promise.resolve(then());
  }
  return processed;
}

const oREGEX = /^(\d*)(?<!1)([1|2|3])$/;
const oFunc = d => {
  const match = oREGEX.exec(d);
  switch (match && match[2]) {
    case "1":
      return d + "st";
    case "2":
      return d + "nd";
    case "3":
      return d + "rd";
    default:
      return d + "th";
  }
}

const dateFormats = {
  M: "%-m", // Month of year as integer [1, 2, ...11, 12]
  MM: "%m", // Month of year as zero-padded interger [01, 02, ...11, 12]
  MMM: "%b",  // Abreviated month name [Jan, Feb, ...Nov, Dec]
  MMMM: "%B", // Full month name
  Q: "%q",  // Quarter [1, 2, 3, 4]
  Qo: ["%q", oFunc],  // Quarter [1st, 2nd, 2rd, 4th]
  D: "%-d", // Day of month [1, 2, ...11, 12, ...]
  Do: ["%-d", oFunc], // Day of month [1st, 2nd, ...11th, 12th, ...]
  DD: "%d", // Zero-padded day of month [01, 02, ...11, 12, ...]
  d: "%w", // Day of week [0, 1, ...5, 6] with Sunday as 0
  ddd: "%a", // abbreviated weekday name [Sun, Mon, ...Fri, Sat]
  dddd: "%A", // full weekday name
  YY: "%y", // Year as 2 digits [20, 21, 22, ...]
  YYYY: "%Y", // Full year [2020, 2021, 2022, ...]
  A: "%p", // AM or PM
  a: ["%p", p => p.toLowerCase()], // am or pm
  H: "%-H", // 24-hour clock hour [0, 1, ...22, 23]
  HH: "%H", // zero-padded 24-hour clock [00, 01, ...22, 23]
  h: "%-I", // 12-hour close [1, 2, ..., 11, 12]
  hh: "%I", // zero-padded 12-hour clock [01, 02, ...11, 12]
  m: "%-M", // minute [0, 1, ...58, 59]
  mm: "%M", // zero-padded minute [00, 01, ...58, 59]
  s: "%-S", // seconds [0, 1, ...58, 59]
  ss: "%S", // zero-padded seconds [00, 01, ...8, 59]
}
const DATE_REGEX = /(M+|Q|Do|D+|do|d+|Y+|A|a|H+|h+|m+|s+)/g;
const getDateFormat = format => {
  const args = format.split(DATE_REGEX)
    .map(a => (a in dateFormats) ? dateFormats[a] : a)
    .reduce((a, c) =>
      typeof c === "string" ? [...a.slice(0, -1), a.slice(-1) + c] : [...a, c, ""]
    , [""])
    .map(a => {
      if (typeof a === "string") {
        return d3timeFormat.timeFormat(a);
      }
      let [format, func] = a;
      format = d3timeFormat.timeFormat(format);
      return v => func(format(v));
    });
  return v => { const date = new Date(v); return args.reduce((a, c) => a + c(date), ""); };
}

const identity = d => d;
export const getFormat = format => {
  if (format === "date") {
    return getDateFormat("MMM Do, YYYY h:mm a");
  }
  else if (/^date:/.test(format)) {
    return getDateFormat(format.slice(5));//value => moment(value).format(format.replace(/^date:/, ""));
  }
  return format ? d3format.format(format) : identity;
}

export const useDmsColumns = columns => {
  return React.useMemo(() => {
    const temp = columns.map(att => {
      if (typeof att === "string") {
        if (/^(dms|api):(.+)$/.test(att)) {
          att = { action: att };
        }
        else {
          att = { path: att };
        }
      }
      if (att.action) {
        return processAction(att);
      }
      if (att.path && !/^self|item|props:/.test(att.path)) {
        att.path = `self:data.${ att.path }`;
      }
      return { ...att,
        key: att.path.split(/[:.]/).pop(),
        format: getFormat(att.format)
      };
    })
    return temp.reduce((a, c) => {
      const [atts, acts] = a;
      if (c.path) {
        atts.push(c);
      }
      else {
        acts.push(c);
      }
      return a;
    }, [[], []]);
  }, [columns]);
}

export const compareActions = (action1 = "", action2 = "") =>
  action1.replace(/^dms:/, "") === action2.replace(/^dms:/, "")

export const capitalize = string =>
  string.toLowerCase().split("")
    .map((c, i) => i === 0 ? c.toUpperCase() : c).join("");
export const prettyKey = key =>
  key.replace(/(?<!^)(?=[A-Z])/g, " ")
    .replace(/[_-]/g, " ")
    .split(" ").map(capitalize).join(" ");

export const ITEM_REGEX = /^item:(.+)$/;
export const PROPS_REGEX = /^props:(.+)$/;
const SELF_REGEX = /^self:(.+)$/;

export const dmsIsNum = value => {
  if ((value === "") ||
      (value === null) ||
      isNaN(value)) {
    return false
  }
  return true
}

const processArgs = (args, sources) =>
  args.map(arg => {
    if (typeof arg === "string") {
      if (SELF_REGEX.test(arg)) {
        return { path: arg };
      }
      return { value: getValue(arg, sources) };
    }
    return { value: arg };
  })

export const makeSort = (sort, sources) => {
  if (!sources) {
    sources = { props: sort }
    sort = get(sources, ["props", "sort"]);
  }
  if (!sources.item) {
    sources.item = get(sources, ["props", "item"], null);
  }

  if (!sort) return false;

  if (typeof sort === "function") return sort;

  let { comparator, accessor } = sort;

  return (a, b) => {
    const av = getValue(accessor, { self: a }),
      bv = getValue(accessor, { self: b });
    return comparator(av, bv);
  }
}

export const makeFilter = (filter, sources) => {
  if (!sources) {
    sources = { props: filter }
    filter = get(sources, ["props", "filter"]);
  }
  if (!sources.item) {
    sources.item = get(sources, ["props", "item"], null);
  }

  if (!filter) return false;

  if (typeof filter === "function") return filter;

  let { args, comparator } = filter;

  args = processArgs(args, sources);

  return d =>
    comparator(
      ...args.map(({ path, value }) => value || getValue(path, { self: d }) || "" )
    );
}

export const checkAuth = (rules, action, props, item) => {
  const rule = get(rules, action.replace(/^(dms|api):(.+)$/, (m, c1, c2) => c2), null);

  if (!rule) return true;

  let { args, comparator } = rule;

  args = args.map(a => {
    if (typeof a === "string") {
      if (a.includes("props:")) {
        return get(props, a.slice(6));
      }
      if (a.includes("item:")) {
        return get(item, a.slice(5));
      }
    }
    return a;
  })
  return comparator(...args);
}

const OPS = [
  ">>>", "==>", "-->", "->", "==", ">", "<", ">=", "<="
]

const getCompare = arg => {
  switch (arg) {
    case "==":
      return (a, b) => a === b;
    case ">":
      return (a, b) => a > b;
    case "<":
      return (a, b) => a < b;
    case ">=":
      return (a, b) => a >= b;
    case "<=":
      return (a, b) => a <= b;
    default:
      return (a, b) => a === b;
  }
}

const applyOp = (op, args, source, func) => {
  switch (op) {
    case ">>>":
      func(args[0]);
      return source.map(d => get(d, ...args, null));
    case "==>":
      return source.filter(d => getCompare(args[1])(get(d, args[0], null), args[2]))
    case "-->":
      return source.reduce((a, c) => getCompare(args[1])(get(c, args[0], null), args[2]) ? c : a, null)
    case "==":
      return getCompare(op)(args[0], source);
    default:
      return source;
  }
}
const getArgs = (op, split) => {
  const { length } = split;
  switch (op) {
    case ">>>":
    case "==":
      return split.splice(length - 2, length);
    case "==>":
    case "-->":
      return split.splice(length - 3, length);
    default:
      return [];
  }
}
const reduceSplit = (split, source, func) => {
  if (!split.length) return source;

  const path = split.pop();
  if (OPS.includes(path)) {
    const args = getArgs(path, split).reverse();
    return reduceSplit(split, applyOp(path, args, source, func), func);
  }
  func(path);
  return reduceSplit(split, get(source, path, null), func);
}

const getValueFromPath = (pathArg, sources, directives, _default, format = identity) => {
  if (typeof pathArg !== "string") return _default || pathArg;

  const {
    preserveKeys,
    preservePath,
    preserveSource
  } = (directives || {});

  const REGEX = /^(item|props|self):(.+)$/;

  let key = null, path = null, source = null;

  const removeSource = p => p.replace(REGEX, (m, c1, c2) => c2),
    setPreserve = d => {
      key = removeSource(d).split(".").pop();
      path = removeSource(d);
      if (source) return;
      source = d.replace(REGEX, (m, c1, c2) => c1);
    }

  const split = pathArg.toString().split(new RegExp(`(${ OPS.join("|") })`))
    .reduce((a, c) => {
      const match = REGEX.exec(c);
      if (match) {
        const [, from, p] = match,
          source = get(sources, from, null);
        setPreserve(c);
        return [...a, get(source, p, null)];
      }
      return [...a, c];
    }, []).reverse();

  const value = format(reduceSplit(split, split.pop(), setPreserve));

  if (preserveKeys) {
    return { key, value };
  }
  else if (preservePath) {
    return { key, path, value };
  }
  else if (preserveSource) {
    return { key, path, source, value };
  }
  return value;
}

export const getValue = (arg, sources, directives = {}, _default = null) => {
  if (!hasValue(arg)) return _default || arg;

  if (!sources.item) {
    sources.item = get(sources, ["props", "item"], null);
  }

  if (Array.isArray(arg)) {
    return arg.map(a => getValue(a, sources, directives, _default));
  }

  if (typeof arg !== "object") {
    if (typeof arg === "string") {
      arg = arg.replace(/^(from:)/, "props:");
    }
    arg = { path: arg }
  }
  let {
    path,
    filter,
    sortBy,
    props = {},
    type,
    key,
    value,
    format,
    interact = []
  } = arg;

  let data = getValueFromPath(path, sources, directives, _default, getFormat(format));

  if (type) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    filter = makeFilter(filter, sources);
    if (filter) {
      data = data.filter(filter);
    }
    if (sortBy) {
      data.sort((a, b) => {
        const av = get(a, sortBy, a),
          bv = get(b, sortBy, b);
        return av < bv ? -1 : bv < av ? 1 : 0;
      })
    }

    if (!Array.isArray(interact)) {
      interact = [interact];
    }

    const args = ({
      data: data.map((d, i) => ({
        key: getValueFromPath(key, { self: d, ...sources }, directives, `key-${ i }`),
        value: getValueFromPath(value, { self: d, ...sources }, directives, d),
        interact: interact.map(a => getValueFromPath(a, { self: d, ...sources }, directives)),
        props: mapDataToProps(props, { self: d, ...sources }, directives)
      })),
      Comp: type
    })
    return (func, interact) => func(args, interact);
  }
  return data;
}

export const mapDataToProps = (map, sources = {}, _directives = {}) => {
  if (!sources.item) {
    sources.item = get(sources, ["props", "item"], null);
  }
  const directiveKeys = Object.keys(map).filter(k => /^\$.+$/.test(k)),
    directives = { ..._directives };
  for (const k of directiveKeys) {
    directives[k.slice(1)] = map[k];
    delete map[k];
  }

  const mappedProps = {};

  for (const key in map) {
    const path = map[key],
      children = key === "children",
      DIRECTIVES = children ? {} : directives;

    let savedChildren = [];
    if (children) {
      savedChildren = React.Children.toArray(get(sources, ["props", "children"], null));
    }

    let result;
    if (Array.isArray(path)) {
      result = path.map(p => getValue(p, sources, DIRECTIVES));
    }
    else if (typeof path === "object") {
      const args = path.args.map(arg => getValueFromPath(arg, sources, DIRECTIVES));
      result = path.func(...args);
    }
    else if (typeof path === "function") {
      result = path(sources);
    }
    else {
      result = getValue(path, sources, DIRECTIVES);
    }

    if (children) {
      if (Array.isArray(result)) {
        result = [...result, ...savedChildren];
      }
      else {
        result = [result, ...savedChildren];
      }
    }
    mappedProps[key] = result;

  }
  return mappedProps;
}
