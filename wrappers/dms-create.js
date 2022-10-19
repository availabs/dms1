import React, { useState, useEffect, useMemo, useCallback } from "react"

import deepequal from "deep-equal"
import get from "lodash.get"
import debounce from "lodash.debounce"

import { hasValue, useTheme, AvlModal } from "modules/avl-components/src"
import { DmsCreateStateClass, makeNewAttribute, makeStorageId } from "./utils/dms-create-utils"
// import { getValue } from "../utils"

export const useSetSections = format => {
  return useMemo(() => {
    let title = null;
    return format.attributes
      .reduce((a, c) => {
        if (c.title !== title) {
          title = c.title;
          a.push({ title, attributes: [] });
        }
        if (get(c, ["dmsActions", "length"], 0)) {
          a[a.length - 1].dmsActions = [...c.dmsActions];
        }
        a[a.length - 1].attributes.push(c);
        return a;
      }, []);
  }, [format]);
}

const InitialState = {
  section: 0,
  Sections: [],
  values: {},
  usingLocalState: false,
  showModal: false
}

export const useDmsCreateState = (props, mode = "create") => {

  const { dmsAction, format, item } = props,
    sections = useSetSections(format);

  const [state, setState] = useState(InitialState);

  const setValues = React.useCallback(newValues => {
    setState(({ values, ...prev }) => ({
      ...prev,
      values: typeof newValues === "function" ? newValues(values) : newValues
    }));
  }, []);

  const {
    values,
    section,
    Sections
  } = state;

  const DmsCreateState = React.useMemo(() => {
    setState(InitialState);
    const newDmsCreateState = new DmsCreateStateClass(setValues, format);
    return newDmsCreateState;
  }, [format, setValues]);

  useEffect(() => {
    return () => {
      DmsCreateState.cleanup();
    }
  }, [DmsCreateState]);

  useEffect(() => {
    if (!Sections.length && sections.length) {
      let firstUnhidden = Infinity;

      const Sections = sections
        .map(({ title, attributes, dmsActions }, index) => {
          const hidden = dmsActions ? !dmsActions.includes(dmsAction) : false;
          firstUnhidden = hidden ? firstUnhidden : Math.min(firstUnhidden, index);
          return {
            index,
            title,
            hidden,
            isActive: false,
            verified: false,
            attributes: attributes.map(att => makeNewAttribute(att, DmsCreateState.setValues, props, mode))
          };
        });

      DmsCreateState.sections = Sections;
      DmsCreateState.numSections = Sections.length;
      DmsCreateState.attributes = Sections.reduce((a, c) => a.concat(c.attributes), []);

      // if (hasValue(DmsCreateState.data)) {
      //   DmsCreateState.initialized = false;
      //   DmsCreateState.initValues(DmsCreateState.data);
      // }

      setState(prev => ({ ...prev, Sections, section: firstUnhidden }));
    };
  }, [Sections.length, sections, props, DmsCreateState, dmsAction, mode]);

  if (Sections.length) {

    DmsCreateState.values = values;
    DmsCreateState.saveValues = DmsCreateState.getValues(values);

    DmsCreateState.hasValues = false;
    DmsCreateState.defaultsLoaded = true;

    DmsCreateState.attributes.forEach(att => {
      DmsCreateState.hasValues = DmsCreateState.hasValues || (
        (att.editable !== false) &&
        att.checkHasValue(values[att.key]) &&
        !deepequal(att.defaultValue, DmsCreateState.saveValues[att.key])
      );
// console.log("ATT:", att.hasDefault, att.defaultLoaded, att);
      DmsCreateState.defaultsLoaded = DmsCreateState.defaultsLoaded && (
        !att.hasDefault || att.defaultLoaded
      );
    });

    Sections.forEach((sect, index) => {
      sect.isActive = section === index;
      sect.verified = sect.attributes.reduce((a, c) => a && c.verified, true);
      // const msgIds = sect.attributes.reduce((a, c) => a.concat(c.getWarnings()), []);
      // sect.warnings = attributeMessages.filter(({ id }) => msgIds.includes(id));
      // sect.hasWarning = Boolean(sect.warnings.length);
    })
    DmsCreateState.verified = Sections.reduce((a, c) => a && c.verified, true);
    DmsCreateState.warnings = Sections.reduce((a, c) => a.concat(c.warnings), []);

    DmsCreateState.activeSection = Sections[section];
    DmsCreateState.activeIndex = section;

    // DmsCreateState.hasWarning = Sections[section].hasWarning;
    // const { canGoNext, canGoPrev } = Sections[section].warnings
    //   .reduce((a, c) => ({
    //     canGoPrev: a.canGoPrev && c.canGoPrev,
    //     canGoNext: a.canGoNext && c.canGoNext
    //   }), { canGoNext: true, canGoPrev: true });

    DmsCreateState.canGoNext = Sections[section].verified &&
      ((section + 1) < Sections.length) && !Sections[section + 1].hidden;
    DmsCreateState.next = () => {
      if (!DmsCreateState.canGoNext) return;
      setState(prev => ({ ...prev, section: prev.section + 1 }));
    };
    DmsCreateState.canGoPrev = (section > 0);
    DmsCreateState.prev = () => {
      if (!DmsCreateState.canGoPrev) return;
      setState(prev => ({ ...prev, section: prev.section - 1 }));
    };
  }

  DmsCreateState.storageId = makeStorageId(format, item);

  DmsCreateState.dmsAction = {
    action: "api:create",
    label: dmsAction,
    seedProps: () => DmsCreateState.getValues(values),
    disabled: !DmsCreateState.verified,
    then: () => {
      DmsCreateState.onSave();
      DmsCreateState.clearValues();
      window.localStorage.removeItem(DmsCreateState.storageId);
    }
  }

  return DmsCreateState;
}

const useLocalStorage = (DmsCreateState, doSave = false, ready = true, item = null) => {

// THIS FORCES THE MODAL TO ALWAYS SLIDE IN WHEN ENTERING CREATE
  const [_ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(setReady, 25, Boolean(window.localStorage))
    return () => clearTimeout(timeout);
  }, []);

  ready = ready && _ready;

  const [showModal, setShowModal] = useState(false),
    [checked, setChecked] = useState(!Boolean(window.localStorage)),
    onHide = useCallback(() => {
      setShowModal(false);
      setChecked(true);
    }, []),
    [data, setData] = useState(null);

// console.log("useLocalStorage", doSave, ready)

  useEffect(() => {
    if (!ready || checked || showModal) return;

    const data = JSON.parse(window.localStorage.getItem(DmsCreateState.storageId));
    setShowModal(Boolean(data));
    setChecked(!Boolean(data));
    setData(data);
  }, [checked, data, DmsCreateState, item, ready, showModal]);

  const loadData = useCallback(() => {
    DmsCreateState.initValues(data);
    setChecked(true);
  }, [data, DmsCreateState]);

  const { saveValues } = DmsCreateState;

  const saveToLocalStorage = useMemo(() => debounce((DmsCreateState) => {
    const { saveValues } = DmsCreateState;
// console.log("SAVING TO LOCAL STORAGE:", saveValues);
    if (hasValue(saveValues)) {
      window.localStorage.setItem(DmsCreateState.storageId, JSON.stringify(saveValues));
    }
  }, 500), []);

  useEffect(() => {
    if (!ready || !checked) return;

    if (doSave) {
      saveToLocalStorage(DmsCreateState);
    }
    else if (!doSave) {
      saveToLocalStorage.cancel();
      window.localStorage.removeItem(DmsCreateState.storageId);
    }
  }, [doSave, ready, checked, DmsCreateState, saveValues, saveToLocalStorage]);

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
  return props => {
    const DmsCreateState = useDmsCreateState(props);

    // useEffect(() => {
    //   if (DmsCreateState.hasValues && DmsCreateState.verified) {
    //     DmsCreateState.setWarning("unsaved", "You have unsaved data!!!");
    //   }
    //   else {
    //     DmsCreateState.setWarning("unsaved", null);
    //   }
    // }, [DmsCreateState.hasValues, DmsCreateState.verified, DmsCreateState]);

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
      if (hasValue(values)) {
        DmsCreateState.initValues(values);
      }
    });

// console.log(DmsCreateState.hasValues, DmsCreateState.verified, DmsCreateState.defaultsLoaded);

    const [show, onHide, loadData] = useLocalStorage(DmsCreateState, DmsCreateState.hasValues, DmsCreateState.defaultsLoaded);

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
  return props => {

    const { item, interact } = props;
    const [data, setData] = useState({});
    const doingLive = React.useRef(false);

    const DmsCreateState = useDmsCreateState(props, "edit"),
      updated = hasBeenUpdated(data, DmsCreateState) && DmsCreateState.initialized;

    DmsCreateState.hasBeenUpdated = updated;

    DmsCreateState.dmsAction.action = "api:edit";
    DmsCreateState.dmsAction.disabled = !updated || DmsCreateState.dmsAction.disabled;

    useEffect(() => {
      const data = get(item, "data", {});
      if (hasValue(data)) {
        DmsCreateState.initialized = false;
        DmsCreateState.initValues(data);
      }
      setData(data);
    }, [item, DmsCreateState]);

    const debounced = React.useMemo(() => {
      return debounce((disabled, itemId, saveValues) => {
        if (!disabled) {
          doingLive.current = true;
          interact("api:edit", itemId, saveValues, { loading: false })
            .then(() => doingLive.current = false);
          //   .then(() => {
          //     DmsCreateState.onSave();
          //     DmsCreateState.clearValues();
          //   });
          // DmsCreateState.initialized = false;
        }
      }, 50);
    }, [interact]);

    React.useEffect(() => {
      if (!item) return;

      const doLiveUpdate = DmsCreateState.attributes.reduce((a, c) => {
        const doLive = (a || c.doLiveUpdate);
        c.doLiveUpdate = false;
        return doLive;
      }, false);

      if (doLiveUpdate) {
        debounced(DmsCreateState.dmsAction.disabled, item.id, DmsCreateState.saveValues);
      }
    }, [DmsCreateState.saveValues, DmsCreateState, item, debounced]);

    // useEffect(() => {
    //   if (DmsCreateState.hasValues && DmsCreateState.verified && updated) {
    //     DmsCreateState.setWarning("unsaved", "You have unsaved edits!!!");
    //   }
    //   else {
    //     DmsCreateState.setWarning("unsaved", null);
    //   }
    // }, [DmsCreateState, DmsCreateState.hasValues, DmsCreateState.verified, updated]);

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

    const [show, onHide, loadData] = useLocalStorage(DmsCreateState, !doingLive.current && DmsCreateState.hasValues && DmsCreateState.hasBeenUpdated, Boolean(item), item);

    return (
      <>
        { (!DmsCreateState.activeSection || !DmsCreateState.hasValues) ? null :
          <Component key={ item.id } { ...props } createState={ DmsCreateState }/>
        }
        <LoadModal show={ show }
          onHide={ onHide }
          action={ loadData }/>
      </>
    )
  }
}
