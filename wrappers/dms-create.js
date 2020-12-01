import React, { useState, useEffect, useMemo, useCallback } from "react"

import deepequal from "deep-equal"
import get from "lodash.get"
import throttle from "lodash.throttle"

import { hasValue, useTheme, AvlModal } from "@availabs/avl-components"
import { DmsCreateStateClass, makeNewAttribute } from "./utils/dms-create-utils"

import { useMessenger } from "../contexts/messenger-context"

export const useSetSections = format => {
  return useMemo(() => {
    let title = null;
    return format.attributes
      .reduce((a, c) => {
        if (c.title !== title) {
          title = c.title;
          a.push({ title, attributes: [] });
        }
        a[a.length - 1].attributes.push(c);
        return a;
      }, []);
  }, [format]);
}

export const useDmsCreateState = props => {

  const { dmsAction, format, item } = props,
    sections = useSetSections(format);

  const dmsMsg = useMessenger(),
    { attributeMessages } = dmsMsg;

  const [section, setSection] = useState(0);
  const [values, setValues] = useState({});

  const [[DmsCreateState, Sections], setState] = useState([new DmsCreateStateClass(setValues, dmsMsg), []]);

  useEffect(() => {
    return () => DmsCreateState.cleanup();
  }, [DmsCreateState]);

  useEffect(() => {
    if (!Sections.length && sections.length) {
      const DmsCreateState = new DmsCreateStateClass(setValues, dmsMsg);

      const Sections = sections.map(({ title, attributes }, index) => ({
        index,
        title,
        isActive: false,
        verified: false,
        attributes: attributes.map(att => makeNewAttribute(att, DmsCreateState.setValues, dmsMsg, props))
      }))

      DmsCreateState.sections = Sections;
      DmsCreateState.numSections = Sections.length;
      DmsCreateState.attributes = Sections.reduce((a, c) => a.concat(c.attributes), []);

      DmsCreateState.initValues(values, false);

      setState([DmsCreateState, Sections]);
    };
  }, [Sections.length, sections, props, dmsMsg, values]);

  return React.useMemo(() => {

    if (Sections.length) {

      DmsCreateState.values = values;
      DmsCreateState.saveValues = DmsCreateState.getValues(values);
      DmsCreateState.hasValues = DmsCreateState.attributes.reduce((a, c) =>
        a || (
          (c.editable !== false) &&
          c.checkHasValue(values[c.key]) &&
          !deepequal(c.defaultValue, DmsCreateState.saveValues[c.key])
        )
      , false);

      DmsCreateState.defaultsLoaded = DmsCreateState.attributes.reduce((a, c) =>
        a && (!c.hasDefault || c.defaultLoaded)
      , true);

      Sections.forEach((sect, index) => {
        sect.isActive = section === index;
        sect.verified = sect.attributes.reduce((a, c) => a && c.verified, true);
        const msgIds = sect.attributes.reduce((a, c) => a.concat(c.getWarnings()), []);
        sect.warnings = attributeMessages.filter(({ id }) => msgIds.includes(id));
        sect.hasWarning = Boolean(sect.warnings.length);
      })
      DmsCreateState.verified = Sections.reduce((a, c) => a && c.verified, true);
      DmsCreateState.warnings = Sections.reduce((a, c) => a.concat(c.warnings), []);

      DmsCreateState.activeSection = Sections[section];
      DmsCreateState.activeIndex = section;

      DmsCreateState.hasWarning = Sections[section].hasWarning;
      const { canGoNext, canGoPrev } = Sections[section].warnings
        .reduce((a, c) => ({
          canGoPrev: a.canGoPrev && c.canGoPrev,
          canGoNext: a.canGoNext && c.canGoNext
        }), { canGoNext: true, canGoPrev: true });

      DmsCreateState.canGoNext = canGoNext &&
        Sections[section].verified && ((section + 1) < Sections.length);
      DmsCreateState.next = () => {
        if (!DmsCreateState.canGoNext) return;
        setSection(section + 1);
      };
      DmsCreateState.canGoPrev = canGoPrev && (section > 0);
      DmsCreateState.prev = () => {
        if (!DmsCreateState.canGoPrev) return;
        setSection(section - 1);
      };
    }

    DmsCreateState.dmsAction = {
      action: "api:create",
      label: dmsAction,
      seedProps: () => DmsCreateState.getValues(values),
      disabled: DmsCreateState.hasWarning || !DmsCreateState.verified,
      then: () => {
        DmsCreateState.onSave();
        if (window.localStorage) {
          window.localStorage.removeItem(makeStorageId(format, item));
        }
      }
    }

    return DmsCreateState;
  }, [DmsCreateState, Sections, attributeMessages, section, values, dmsAction, format, item]);
}

const makeStorageId = (format = {}, item = null) =>
  `${ format.app }+${ format.type }${ item ? `:${ item.id }` : `` }`;

const useLocalStorage = (DmsCreateState, format = {}, doSave = false, ready = true, item = null) => {

  const [_ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(setReady, 50, Boolean(window.localStorage))
    return () => clearTimeout(timeout);
  }, []);

  ready = ready && _ready;

  const storageId = makeStorageId(format, item);

  const [showModal, setShowModal] = useState(false),
    [checked, setChecked] = useState(!Boolean(window.localStorage)),
    onHide = useCallback(() => {
      setShowModal(false);
      setChecked(true);
    }, []),
    [data, setData] = useState(null);

  useEffect(() => {
    if (!ready || checked || showModal) return;

    const data = JSON.parse(window.localStorage.getItem(storageId));
    setShowModal(Boolean(data));
    setChecked(!Boolean(data));
    setData(data);
  }, [storageId, checked, data, DmsCreateState, format, item, ready, showModal]);

  const loadData = useCallback(() => {
    DmsCreateState.initValues(data);
    setChecked(true);
  }, [data, DmsCreateState]);

  const { saveValues } = DmsCreateState;

  const saveToLocalStorage = useMemo(() => throttle((storageId, DmsCreateState) => {
    const { saveValues } = DmsCreateState;
    window.localStorage.setItem(storageId, JSON.stringify(saveValues));
  }, 500), []);

  useEffect(() => {
    if (!ready || !checked) return;

    if (doSave) {
      saveToLocalStorage(storageId, DmsCreateState);
    }
    else if (!doSave) {
      window.localStorage.removeItem(storageId);
    }
  }, [doSave, storageId, ready, checked, DmsCreateState, saveValues, saveToLocalStorage]);

  return [showModal, onHide, loadData];
}

const LoadModal = ({ action, ...props }) => {
  const theme = useTheme();
  return (
    <AvlModal { ...props }
      closeLabel="Continue Without Loading"
      actions={ [{ label: "Load Data", action }] }>
      <div className="text-center">
        <div className="text-xl">
          You have unsaved data.<br />Do you wish to load this data?
        </div>
        <div className={ `font-bold text-2xl py-2 px-4 ${ theme.textWarning }` }>
          WARNING: The unsaved data will be lost if not loaded!
        </div>
      </div>
    </AvlModal>
  )
}

export const dmsCreate = Component => {
  return ({ ...props }) => {
    const DmsCreateState = useDmsCreateState(props);

    useEffect(() => {
      if (DmsCreateState.hasValues && DmsCreateState.verified) {
        DmsCreateState.setWarning("unsaved", "You have unsaved data!!!");
      }
      else {
        DmsCreateState.setWarning("unsaved", null);
      }
    }, [DmsCreateState.hasValues, DmsCreateState.verified, DmsCreateState]);

    useEffect(() => {
      if (DmsCreateState.defaultsLoaded) return;

      const values = {};

      DmsCreateState.attributes.forEach(att => {
        // if (("default" in att) && !att.hasValue) {
        //   const value = getValue(att.default, { props });
        //   hasValue(value) && (values[att.key] = value);
        // }
        if (att.hasDefault && !att.defaultLoaded) {
          const value = att.getDefault(props);
          hasValue(value) && (values[att.key] = value);
        }
      })
      if (Object.keys(values).length) {
        DmsCreateState.initValues(values);
      }
    });

    const [show, onHide, loadData] = useLocalStorage(DmsCreateState, props.format, DmsCreateState.hasValues, DmsCreateState.defaultsLoaded);

    return (
      <>
        { !DmsCreateState.activeSection ? null :
          <Component { ...props } createState={ DmsCreateState }/>
        }
        <LoadModal show={ show }
          onHide={ onHide }
          action={ loadData }/>
      </>
    )
  }
}

const hasBeenUpdated = (base, DmsCreateState) => {
  const { saveValues, attributes, ignoredAttributes } = DmsCreateState;

  return ignoredAttributes.length || attributes.reduce((a, c) =>
    a || !deepequal(base[c.key], saveValues[c.key])
  , false);
}

export const dmsEdit = Component => {
  return ({ ...props }) => {

    const { item } = props;

    const [data, setData] = useState({});
    useEffect(() => {
      setData(get(item, "data", {}));
    }, [item]);

    const DmsCreateState = useDmsCreateState(props),
      updated = hasBeenUpdated(data, DmsCreateState);

    useEffect(() => {
      if (DmsCreateState.hasValues && DmsCreateState.verified && updated) {
        DmsCreateState.setWarning("unsaved", "You have unsaved edits!!!");
      }
      else {
        DmsCreateState.setWarning("unsaved", null);
      }
    }, [DmsCreateState, DmsCreateState.hasValues, DmsCreateState.verified, updated]);

    DmsCreateState.dmsAction.action = "api:edit";
    DmsCreateState.dmsAction.disabled = !updated || DmsCreateState.dmsAction.disabled;

    useEffect(() => {
      if (!DmsCreateState.initialized && Object.keys(data).length) {
        DmsCreateState.initValues(data);
      }
    }, [data, DmsCreateState]);

    const attributeMap = DmsCreateState.attributes
      .reduce((a, c) => { a[c.key] = c; return a; }, {});

    DmsCreateState.badAttributes = [];
    for (const att in data) {
      if (!DmsCreateState.ignoredAttributes.includes(att) && !(att in attributeMap) && hasValue(data[att])) {
        DmsCreateState.badAttributes.push({
          key: att,
          value: data[att]
        });
      }
    }

    const [showModal, onHide, loadData] = useLocalStorage(DmsCreateState, props.format, DmsCreateState.hasValues && updated, Boolean(item), item);

    return (
      <>
        { (!DmsCreateState.activeSection || !DmsCreateState.hasValues) ? null :
          <Component { ...props } createState={ DmsCreateState }/>
        }
        <LoadModal show={ showModal }
          onHide={ onHide }
          action={ loadData }/>
      </>
    )
  }
}
