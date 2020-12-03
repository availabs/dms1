import React from "react"

import { useTheme, imgLoader, showLoading } from "@availabs/avl-components"

import {
  EditorState,
  CompositeDecorator,
  convertToRaw,
  convertFromRaw
} from 'draft-js';
import Editor from "@draft-js-plugins/editor"

import 'draft-js/dist/Draft.css';
import './styles.css'

import makeButtonPlugin from './buttons';
import makeToolbarPlugin from "./toolbar"
import makeImagePlugin from "./image"
import makeLinkItPlugin from "./linkify-it"
import makeSuperSubScriptPlugin from "./super-sub-script"
import makePositionablePlugin from "./positionable"
import makeStuffPlugin from "./stuff"
import makeResizablePlugin from "./resizable"

const buttonPlugin = makeButtonPlugin(),
  { BlockQuoteButton,
    CodeBlockButton,
    HeaderOneButton,
    HeaderTwoButton,
    HeaderThreeButton,
    OrderedListButton,
    UnorderedListButton,
    BoldButton,
    CodeButton,
    ItalicButton,
    StrikeThroughButton,
    SubScriptButton,
    SuperScriptButton,
    UnderlineButton,
    LeftAlignButton,
    CenterAlignButton,
    JustifyAlignButton,
    RightAlignButton,
    TextIndentButton,
    TextOutdentButton
  } = buttonPlugin;

const toolbarPlugin = makeToolbarPlugin(),
  { Toolbar, Separator } = toolbarPlugin;

const positionablePlugin = makePositionablePlugin(),
  resizablePlugin = makeResizablePlugin();

const imagePlugin = makeImagePlugin({
    wrappers: [
      positionablePlugin.wrapper,
      resizablePlugin.wrapper
    ]
  }),
  { addImage } = imagePlugin;

const linkItPlugin = makeLinkItPlugin();

const plugins = [
  buttonPlugin,
  toolbarPlugin,
  imagePlugin,
  linkItPlugin,
  makeSuperSubScriptPlugin(),

  positionablePlugin,
  resizablePlugin,

  makeStuffPlugin()
];

const decorator = new CompositeDecorator(
  linkItPlugin.decorators
)

export const createEmpty = () =>
  EditorState.createEmpty(decorator);
export const createWithContent = content =>
  EditorState.createWithContent(convertFromRaw(content), decorator);
export const createEditorState = value =>
  Boolean(value) ? createWithContent(value) : createEmpty();
export { convertToRaw }

export const loadFromLocalStorage = id => {
  if (window.localStorage) {
    let saved = JSON.parse(window.localStorage.getItem(id));
    if (saved) {
      if ((saved = convertFromRaw(saved)).hasText()) {
        return createWithContent(saved);
      }
      else {
        window.localStorage.removeItem(id);
      }
    }
  }
  return createEmpty();
}
export const saveToLocalStorage = (id, editorState) => {
  if (window.localStorage) {
    const saved = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
    window.localStorage.setItem(id, saved);
  }
}

class MyEditor extends React.Component {
  static defaultProps = {
    disabled: false,
    autoFocus: false,
    id: "draft-js-editor",
    placeholder: "Type a value..."
  }
  constructor(props, ...args) {
    super(props, ...args);
    this.state = {
      hasFocus: false
    }

    this.editor = null;

    this.handleDroppedFiles = this.handleDroppedFiles.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }
  componentDidMount() {
    this.props.autoFocus && this.focus();
  }
  componentWillUnmount() {
    this.editor = null;
  }

  focus() {
    setTimeout(() => { this.editor && this.editor.focus(); }, 25);
  }
  handleChange(editorState) {
    this.props.onChange(editorState);
  }
  handleDroppedFiles(selection, files, { getEditorState }) {
    if (this.props.disabled || !files.length) return "not-handled";

    const file = files[0];

    if (!/^image[/]/.test(file.type)) {
      return "not-handled";
    }

    this.props.uploadImage(file)
      .then(({ filename, url }) => {
        this.handleChange(addImage(url, getEditorState()));
        // this.handleChange(addImage(getEditorState(), url));
      });
    return "handled";
  }
  onFocus(e) {
    this.setState(state => ({ hasFocus: true }));
    if (typeof this.props.onFocus === "function") {
      this.props.onFocus(e);
    }
  }
  onBlur(e) {
    this.setState(state => ({ hasFocus: false }));
    if (typeof this.props.onBlur === "function") {
      this.props.onBlur(e);
    }
  }

  render() {
    return (
      <EditorWrapper id={ this.props.id }
        hasFocus={ this.state.hasFocus }>

        <div className="px-2 pb-2 flow-root">
          <Editor ref={ n => this.editor = n }
            placeholder={ this.props.placeholder }
            editorState={ this.props.value }
            onChange={ this.handleChange }
            plugins={ plugins }
            readOnly={ this.props.disabled }
            handleDroppedFiles={ this.handleDroppedFiles }
            spellCheck={ true }
            onFocus={ this.onFocus }
            onBlur={ this.onBlur }/>
        </div>

        <Toolbar>
          <BoldButton />
          <ItalicButton />
          <StrikeThroughButton />
          <UnderlineButton />
          <SubScriptButton />
          <SuperScriptButton />
          <CodeButton />

          <Separator />

          <HeaderOneButton />
          <HeaderTwoButton />
          <HeaderThreeButton />

          <Separator />

          <BlockQuoteButton />
          <CodeBlockButton />
          <OrderedListButton />
          <UnorderedListButton />

          <Separator />

          <LeftAlignButton />
          <CenterAlignButton />
          <JustifyAlignButton />
          <RightAlignButton />

          <Separator />

          <TextOutdentButton />
          <TextIndentButton />
        </Toolbar>

        { this.props.children }

      </EditorWrapper>
    );
  }
}
const LoadingOptions = {
  position: "absolute",
  className: "rounded"
}
export default imgLoader(showLoading(MyEditor, LoadingOptions));

const EditorWrapper = ({ children, hasFocus, id, ...props }) => {
  const theme = useTheme();
  return (
    <div className={ `pt-16 relative rounded draft-js-editor
      ${ theme.inputBg.replace("cursor-pointer", "cursor-auto") } w-full
      ${ hasFocus ? theme.inputBorderFocus : theme.inputBorder }
    ` } { ...props }>
      { children }
    </div>
  )
}
