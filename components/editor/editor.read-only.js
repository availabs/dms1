import React from "react"

import {
  EditorState,
  convertFromRaw,
  CompositeDecorator
} from 'draft-js';
import Editor from 'draft-js-plugins-editor';

import 'draft-js/dist/Draft.css';
import './styles.css'

import makeButtonPlugin from './buttons';
import makeImagePlugin from "./image"
import makeLinkItPlugin from "./linkify-it"
import makeSuperSubScriptPlugin from "./super-sub-script"
import makePositionablePlugin from "./positionable"
import makeStuffPlugin from "./stuff"
import makeResizablePlugin from "./resizable"

const positionablePlugin = makePositionablePlugin();
const resizablePlugin = makeResizablePlugin();

const imagePlugin = makeImagePlugin({
  wrappers: [
    positionablePlugin.wrapper,
    resizablePlugin.wrapper
  ]
});

const linkItPlugin = makeLinkItPlugin();

const plugins = [
  makeButtonPlugin(),
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

class ReadOnlyEditor extends React.Component {
  static defaultProps = {
    spellCheck: true,
    isRaw: true
  }
  state = {
    editorState: EditorState.createEmpty()
  }

  componentDidMount() {
    if (this.props.isRaw && this.props.value) {
      this.loadFromRawContent(this.props.value);
    }
    else if (!this.props.isRaw) {
      this.onChange(this.props.value);
    }
  }

  loadFromRawContent(content) {
    const editorState = EditorState.createWithContent(
      convertFromRaw(content),
      decorator
    );
    this.onChange(editorState);
  }

  onChange(editorState) {
    this.setState({ editorState });
  }

  render() {
    if (!this.props.value) return null;

    return (
      <div className="draft-js-editor read-only-editor flow-root">
        <Editor editorState={ this.state.editorState }
          onChange={ es => this.onChange(es) }
          plugins={ plugins }
          readOnly={ true }
          spellCheck={ this.props.spellCheck }/>
      </div>
    );
  }
}
export default ReadOnlyEditor;
