import React from "react"

import deepequal from "deep-equal"
import get from "lodash.get"
import debounce from "lodash.debounce"

import { hasValue, useTheme, AvlModal } from "modules/avl-components/src"
import { DmsCreateStateClass, makeNewAttribute, makeStorageId } from "./utils/dms-create-utils"
// import { getValue } from "../utils"

export const useSetSections = format => {
  return React.useMemo(() => {
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

const checkDefaultsLoaded = ({ Attributes }) => {
  return Attributes.reduce((a, c) => {
    return a && c.defaultLoaded;
  }, true);
}
const checkHasValues = ({ Attributes }) => {
  return Attributes.reduce((a, c) => {
    return a || c.hasValues;
  }, false);
}
const verifyValues = ({ Attributes }) => {
  return Attributes.reduce((a, c) => {
    return a && c.verified;
  }, true);
}

const Init = ({ props, mode, sections }) => {
  const { format, item } = props;

  const Sections = sections.map(({ title, attributes, dmsActions }) => {
    return {
      title,
      attributes: attributes.map(att => makeNewAttribute(att, props, mode))
    };
  });
  const Attributes = Sections.reduce((a, c) => {
    a.push(...c.attributes);
    return a;
  }, []);
  const hasDefaults = Attributes.reduce((a, c) => {
    return a || c.hasDefault;
  }, false);

  return {
    numSections: Sections.length,
    activeSection: Sections[0],
    activeSectionIndex: 0,

    verified: false,

    values: {},
    hasValues: false,
    hasDefaults,

    timestamp: 0,

    initialized: false,

    storageId: makeStorageId(format, item),

    canGoPrev: false,
    canGoNext: Sections.length > 1,

    Sections,
    Attributes
  }
}
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "load-default-values":
      return {
        ...state,
        values: payload.values,
        initialized: checkDefaultsLoaded(state),
        timestamp: performance.now()
      }
    case "init-values":
      return {
        ...state,
        values: payload.values,
        initialized: true,
        timestamp: performance.now()
      }
    case "set-values":
      return {
        ...state,
        timestamp: performance.now(),
        hasValues: checkHasValues(state),
        verified: verifyValues(state),
        values: { ...state.values, ...payload.values }
      }
    case "set-index":
      return {
        ...state,
        activeSectionIndex: payload.index,
        activeSection: state.Sections[payload.index],
        canGoPrev: payload.index > 0,
        canGoNext: payload.index < (state.Sections.length - 1)
      }
    case "clear-values": {
      state.Attributes.forEach(att => att.clearValue());
      return {
        ...state,
        verified: false,
        values: {},
        hasValues: false,
        timestamp: 0,
        initialized: false
      }
    }
    case "reset-state":
      return Init(payload);
    default:
      return state;
  }
}

export const useDmsCreateState = (props, mode = "create") => {

  const sections = useSetSections(props.format);

  const [state, dispatch] = React.useReducer(Reducer, { props, mode, sections }, Init);

  const setValues = React.useCallback(values => {
    dispatch({
      type: "set-values",
      values
    })
  }, []);

  React.useEffect(() => {
    state.Attributes.forEach(att => {
      att.setValues = setValues;
    });
  }, [state.Attributes, setValues]);

  const loadDefaultValues = React.useCallback(props => {
    let defaultValues = {};
    const setDefaultValues = value => {
      defaultValues = { ...defaultValues, ...value };
    }
    state.Attributes.filter(att => att.hasDefault)
      .forEach(att => {
        const savedSetValues = att.setValues;
        att.setValues = setDefaultValues;
        att.loadDefaultValue(props);
        att.setValues = savedSetValues;
      })
    dispatch({
      type: "load-default-values",
      values: defaultValues
    });
  }, [state.Attributes]);

  const initValues = React.useCallback(values => {
    let initValues = {};
    const setInitValues = value => {
      initValues = { ...initValues, ...value };
    }
    state.Attributes.forEach(att => {
      const savedSetValues = att.setValues;
      att.setValues = setInitValues;
      att.initValue(values[att.key]);
      att.setValues = savedSetValues;
    });
    dispatch({
      type: "init-values",
      values: initValues
    });
  }, [state.Attributes]);

  const getSaveValues = React.useCallback(() => {
    return state.Attributes.reduce((a, c) => {
      a[c.key] = c.getSaveValue(c.value);
      return a;
    }, {});
  }, [state.Attributes]);

  const clearValues = React.useCallback(() => {
    dispatch({ type: "clear-values" });
  }, [state.Attributes]);

  const prev = React.useCallback(() => {
    if (!state.canGoPrev) return;
    dispatch({
      type: "set-index",
      index: state.index - 1
    })
  }, [state.canGoPrev, state.index]);

  const next = React.useCallback(() => {
    if (!state.canGoNext) return;
    dispatch({
      type: "set-index",
      index: state.index + 1
    })
  }, [state.canGoNext, state.index]);

  return React.useMemo(() => ({
    ...state, prev, next,
    loadDefaultValues,
    initValues,
    getSaveValues
  }), [
    state, prev, next,
    loadDefaultValues,
    initValues,
    getSaveValues
  ]);
}

const INITAL_STATE = {
  data: null,
  showModal: false,
  checked: false
}
const LocalStorageReducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "update-state":
      return { ...state, ...payload };
    default:
      return state;
  }
}

const useLocalStorage = (DmsCreateState, dmsCreateStateReady = false, doSave = false) => {

  const [state, dispatch] = React.useReducer(LocalStorageReducer, INITAL_STATE);

  const { data, showModal, checked } = state;

  const { storageId, initValues, getSaveValues } = DmsCreateState;

  React.useEffect(() => {
    if (!dmsCreateStateReady || showModal || checked) return;

    const data = JSON.parse(window.localStorage.getItem(storageId));

    dispatch({
      type: "update-state",
      showModal: Boolean(data),
      checked: !Boolean(data),
      data
    })
  }, [dmsCreateStateReady, showModal, checked, storageId]);

  const onHide = React.useCallback(() => {
    dispatch({
      type: "update-state",
      showModal: false,
      checked: true
    });
  }, []);

  const loadData = React.useCallback(() => {
    initValues(data);
  }, [data, initValues]);

  const saveToLocalStorage = React.useMemo(() => {
    return debounce(DmsCreateState => {
      const saveValues = DmsCreateState.getSaveValues();
      if (hasValue(saveValues)) {
        window.localStorage.setItem(DmsCreateState.storageId, JSON.stringify(saveValues));
      }
    }, 500);
  }, []);

  React.useEffect(() => {
    if (!dmsCreateStateReady || !checked) return;

    if (doSave) {
      saveToLocalStorage(DmsCreateState);
    }
    else if (!doSave) {
      saveToLocalStorage.cancel();
      window.localStorage.removeItem(DmsCreateState.storageId);
    }
  }, [dmsCreateStateReady, checked, doSave, DmsCreateState, saveToLocalStorage]);

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

    const { dmsAction } = props;

    const DmsCreateState = useDmsCreateState(props, "create");

    const disabled = !(DmsCreateState.hasValues && DmsCreateState.verified)

    DmsCreateState.dmsAction = React.useMemo(() => {
      return {
        action: `api:create`,
        label: dmsAction,
        seedProps: () => DmsCreateState.getSaveValues(),
        then: () => DmsCreateState.clearValues(),
        disabled
      }
    }, [dmsAction, DmsCreateState, disabled]);

    React.useEffect(() => {
      if (DmsCreateState.initialized) return;

      DmsCreateState.loadDefaultValues(props);
    });

    const ready = DmsCreateState.initialized,
      doSave = DmsCreateState.hasValues && DmsCreateState.verified;
    const [show, onHide, loadData] = useLocalStorage(DmsCreateState, ready, doSave);

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

export const dmsEdit = Component => {
  return props => {

    const { item, interact, dmsAction } = props;

    const DmsCreateState = useDmsCreateState(props, "edit"),
      { Attributes, getSaveValues } = DmsCreateState;

    const checkHasBeenUpdated = React.useMemo(() => {
      return debounce(getSaveValues => {
        const data = get(item, "data", null),
          saveValues = getSaveValues();
        return hasValue(saveValues) && !deepequal(data, saveValues);
      }, 500, { leading: true });
    }, [item]);

    const hasBeenUpdated = checkHasBeenUpdated(getSaveValues);

    const disabled = !DmsCreateState.verified || !hasBeenUpdated;

    DmsCreateState.dmsAction = React.useMemo(() => {
      return {
        action: `api:edit`,
        label: dmsAction,
        seedProps: () => getSaveValues(),
        disabled
      };
    }, [dmsAction, disabled, getSaveValues]);

    React.useEffect(() => {
      const data = get(item, "data", {});
      if (hasValue(data) && !DmsCreateState.initialized) {
        DmsCreateState.initValues(data);
      }
    }, [item, DmsCreateState.initialized]);

    const liveUpdate = React.useMemo(() => {
      return debounce(getSaveValues => {
        interact("api:edit", item.id, getSaveValues(), { loading: false });
      }, 250);
    }, [item, interact]);

    React.useEffect(() => {
      if (disabled) return;

      const doLiveUpdate = Attributes.reduce((a, c) => {
        const doLive = (a || c.doLiveUpdate);
        c.doLiveUpdate = false;
        return doLive;
      }, false);

      if (doLiveUpdate) {
        liveUpdate(getSaveValues);
      }
    }, [Attributes, getSaveValues, disabled, liveUpdate]);

    const ready = DmsCreateState.initialized,
      doSave = DmsCreateState.hasValues && DmsCreateState.verified && hasBeenUpdated;
    const [show, onHide, loadData] = useLocalStorage(DmsCreateState, ready, doSave);

    return (
      <>
        { (!DmsCreateState.activeSection || !DmsCreateState.initialized) ? null :
          <Component key={ item.id } { ...props } createState={ DmsCreateState }/>
        }
        <LoadModal show={ show }
          onHide={ onHide }
          action={ loadData }/>
      </>
    )
  }
}
