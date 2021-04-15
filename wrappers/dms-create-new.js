import React from "react"

import deepequal from "deep-equal"
import get from "lodash.get"
import debounce from "lodash.debounce"

import { hasValue, useTheme, AvlModal } from "@availabs/avl-components"
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

export const useDmsCreateState = (props, mode = "create") => {

  const [values, setValues] = React.useState({});

  const sections = useSetSections(props.format);

  const DmsCreateState = React.useMemo(() => {

    DmsCreateState = new DmsCreateStateClass(setValues);

    const Sections = sections
      .map(({ title, attributes, dmsActions }) => {
        const hidden = dmsActions ? !dmsActions.includes(props.dmsAction) : false;
        if (!hidden) {
          ++DmsCreateState.numSections;
          if (DmsCreateState.activeSectionIndex === -1) {
            DmsCreateState.activeSectionIndex = DmsCreateState.numSections - 1;
          }
        }
        return {
          title,
          hidden,
          isActive: false,
          verified: false,
          attributes: attributes.map(att => makeNewAttribute(att, DmsCreateState.setValues, props, mode))
        };
      });

    DmsCreateState.Sections = Sections.filter(({ hidden }) => !hidden);
    DmsCreateState.HiddenSections = Sections.filter(({ hidden }) => hidden);
    DmsCreateState.Attributes = Sections.reduce((a, c) => a.concat(c.attributes), []);

    return DmsCreateState;
  }, [sections]);

  const [index, setIndex] = React.useState(DmsCreateState.activeSectionIndex);

  DmsCreateState.storageId = React.useMemo(() => {
    return makeStorageId(props.format, props.item);
  }, [props.format, props.item]);

  DmsCreateState.dmsAction = React.useMemo(() => {
    return {
      action: `api:${ mode }`,
      label: props.dmsAction,
      seedProps: () => DmsCreateState.getSaveValues(values),
      disabled: !DmsCreateState.verified,
      then: () => DmsCreateState.clearValues()
    }
  }, [props.dmsAction, mode, values]);

  return React.useMemo(() => {
    const { Sections } = DmsCreateState;

    if (Sections.length) {

      DmsCreateState.values = values;
      DmsCreateState.saveValues = DmsCreateState.getSaveValues(values);

      DmsCreateState.hasValues = false;
      DmsCreateState.defaultsLoaded = true;

      DmsCreateState.Attributes.forEach(att => {
        DmsCreateState.hasValues = DmsCreateState.hasValues || att.hasValue;
        DmsCreateState.defaultsLoaded = DmsCreateState.defaultsLoaded && att.defaultLoaded;
      });

      Sections.forEach((section, i) => {
        section.isActive = index === i;
        section.verified = section.attributes.reduce((a, c) => a && c.verified, true);
      })
      DmsCreateState.verified = Sections.reduce((a, c) => a && c.verified, true);
      DmsCreateState.warnings = Sections.reduce((a, c) => a.concat(c.warnings), []);

      DmsCreateState.activeSectionIndex = index;
      DmsCreateState.activeSection = Sections[index];

      DmsCreateState.canGoNext = Sections[index].verified && ((index + 1) < Sections.length);
      DmsCreateState.next = () => {
        if (!DmsCreateState.canGoNext) return;
        setIndex(index + 1);
      };
      DmsCreateState.canGoPrev = (index > 0);
      DmsCreateState.prev = () => {
        if (!DmsCreateState.canGoPrev) return;
        setIndex(index - 1);
      };
    }

    return DmsCreateState;

  }, [values, index]);
}
