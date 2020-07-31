import React from "react"

import { Button } from "components/avl-components/components/Button"

import get from "lodash.get"
import styled from "styled-components"

import { useTheme } from "components/avl-components/wrappers/with-theme"
import imgLoader from "components/avl-components/wrappers/img-loader"
import showLoading from "components/avl-components/wrappers/show-loading"
import { useBrush } from "components/avl-components/components/utils"

const ImgInput = ({ height = 500, autoFocus = false, value: propsValue, onChange, ...props }) => {
  const [draggingOver, setDragging] = React.useState(false);

  const dragOver = e => {
    stopIt(e);

    setDragging(true);
  }
  const onDragExit = e => {
    stopIt(e);

    setDragging(false);
  }
  const stopIt = e => {
    e.preventDefault();
    e.stopPropagation();
  }

  const [stack, setStack] = React.useState([]),
    [index, setIndex] = React.useState(-1),
    [history, setHistory] = React.useState([]);

  const pushStack = v => {
      setStack([...stack.slice(0, index + 1), v]);
      setIndex(index + 1);
    },
    clearStack = () => {
      setStack([]);
      setIndex(-1);
    };

    React.useEffect(() => {
      if (propsValue) {
        setStack([propsValue]);
        setIndex(0)
      }
    }, [propsValue]);

  const [img, setImg] = React.useState(null),
    [, setLoaded] = React.useState(false),
    imgSrc = get(stack, [index, "url"]);

  const uploadImage = file => {
    props.uploadImage(file)
      .then(({ filename, url }) => onChange({ filename, url }));
  }
  const dropIt = e => {
    e.preventDefault();
    e.stopPropagation();

    if (props.disabled) return;

    setDragging(false);

    const file = get(e, ["dataTransfer", "files", 0], null);
    file && uploadImage(file);
  }
  const handleChange = e => {
    e.preventDefault();
    e.stopPropagation();

    if (props.disabled) return;

    const file = get(e, ["target", "files", 0], null);
    file && uploadImage(file);
  }
  const applyCrop = e => {
    const { naturalHeight } = img,
      { height } = svg.getBoundingClientRect(),
      scale = naturalHeight / height;

    const [[x1, y1], [x2, y2]] = selection.map(d => d.map(dd => dd * scale)),
      filename = stack[index].filename;

    props.editImage(imgSrc, filename, "crop", [x2 - x1, y2 - y1, x1, y1])
      .then(url => {
        pushStack({ filename, url });
        setHistory([...history, url]);
      })
      .then(clearBrush);
  }
  const undo = e => {
    clearBrush();
    setIndex(Math.max(0, index - 1));
  }
  const redo = e => {
    clearBrush();
    setIndex(Math.min(stack.length - 1, index + 1));
  }
  const saveImage = () => {
    const { url, filename } = stack[index];
    props.saveImage(url, filename, history)
      .then(url => {
        clearStack();
        onChange({ url, filename });
      });
  }
  const removeImage = () => {
    clearStack();
    onChange(null);
  }

  // React.useEffect(() => {
  //   if (index < 1) {
  //     Attribute.setWarning("unsaved", null);
  //   }
  //   else {
  //     Attribute.setWarning("unsaved", {
  //       msg: "You have unsaved edits to your image!!! Either Save or Undo your edits.",
  //       canGoPrev: false
  //     });
  //   }
  // }, [index, Attribute, propsValue, onChange])

  const [svg, setSvg] = React.useState(null)
  const {
    Brush,
    selection,
    clearBrush
  } = useBrush(svg);

  const [hasFocus, setFocus] = React.useState(autoFocus),
    [ref, setRef] = React.useState(null);
  React.useEffect(() => {
    autoFocus && ref && ref.focus();
  }, [autoFocus, ref]);

  const theme = useTheme();

  return (
    <div className={ `
        w-full ${ hasFocus ? theme.inputBorderFocus : theme.inputBorder  } rounded p-2 relative
      ` } tabIndex="0" ref={ setRef } onClick={ e => ref.focus() }
      onFocus={ e => setFocus(true) }
      onBlur={ e => setFocus(false) }>
      <div className={ `
          border-2 border-dashed rounded p-2 ${ theme.inputBg }
          ${ draggingOver ? "border-gray-500" : "" }
        ` }
        onDragOver={ e => !props.disabled && dragOver(e) }
        onDragLeave={ e => !props.disabled && onDragExit(e) }
        onDrop={ e => dropIt(e) }>

        <div className="relative flex items-center justify-center w-full" style={ { height: `${ height }px` } }>

          { imgSrc ?
              <div className="flex-1 absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center hoverable">
                <div className="relative" style={ { maxHeight: `${ height }px` } }>
                  <div className="z-0 h-full" style={ { maxHeight: `${ height }px` } }>
                    <img src={ imgSrc } alt={ propsValue  } ref={ setImg }
                      className="block" style={ { maxHeight: `${ height }px` } }
                      onLoad={ e => setLoaded(true) }/>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full z-10"
                    style={ { maxHeight: `${ height }px` } }>
                    <svg className="w-full h-full" ref={ setSvg }>
                      { <Brush /> }
                    </svg>
                  </div>
                </div>
                <div onClick={ e => removeImage() }
                  className={ `
                    absolute right-0 top-0 z-10 show-on-hover
                    rounded bg-red-500 p-1 cursor-pointer
                  ` }>
                  <svg width="20" height="20">
                    <line x2="20" y2="20" style={ { stroke: "#fff", strokeWidth: 4 } }/>
                    <line y1="20" x2="20" style={ { stroke: "#fff", strokeWidth: 4 } }/>
                  </svg>
                </div>
              </div>
            : draggingOver ?
              <span className="far fa-image fa-9x pointer-events-none opacity-50"/>
            : props.disabled ?
              <span className="fas fa-times fa-9x pointer-events-none opacity-50"/>
            :
              <div className="flex-0 flex flex-col items-center">
                <LabelButton id={ props.id } onChange={ e => handleChange(e) }/>
                <div className="mt-1">...or drag and drop</div>
                <div className="mt-1">{ props.message }</div>
              </div>
          }

        </div>

      </div>
      <div className={ `mt-2 p-2 border-2 rounded ${ theme.accent1 } flex` }>
        <BtnGroup className="flex flex-1">
          <Button disabled={ !Boolean(selection) } onClick={ e => applyCrop(e) } tabIndex="-1">
            Apply Crop
          </Button>
          <Button disabled={ index < 1 } onClick={ e => undo(e) } tabIndex="-1">
            Undo
          </Button>
          <Button disabled={ (index + 1) === stack.length } onClick={ e => redo(e) } tabIndex="-1">
            Redo
          </Button>
        </BtnGroup>
        <div className="flex-0 flex justify-end">
          <Button disabled={ get(stack, [index, "url"]) === get(propsValue, "url") }
            onClick={ e => saveImage() } buttonTheme="buttonSuccess">
            Save
          </Button>
        </div>
      </div>
      { props.children }
    </div>
  )
}
const LoadingOptions = {
  position: "absolute",
  className: "rounded"
}
export default imgLoader(showLoading(ImgInput, LoadingOptions));

const BtnGroup = styled.div`
  > button {
    margin-right: 0.25rem;
  }
  > button:last-child {
    margin-right: 0rem;
  }
`

const LabelButton = props => {
  const theme = useTheme();
  return (
    <div>
      <label htmlFor={ props.id } className={ `${ theme.buttonInfo } cursor-pointer` }>
        Select an image file...
      </label>
      <input className="py-1 px-2 w-full rounded hidden" tabIndex="-1"
        type="file" accept="image/*" { ...props }/>
    </div>
  )
}
