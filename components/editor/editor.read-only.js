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

const positionablePlugin = makePositionablePlugin(),
  { positionable } = positionablePlugin;

const imagePlugin = makeImagePlugin({ wrapper: positionable });

const linkItPlugin = makeLinkItPlugin();

const plugins = [
  makeButtonPlugin(),
  imagePlugin,
  linkItPlugin,
  makeSuperSubScriptPlugin(),
  positionablePlugin,
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
    if (this.props.isRaw) {
      this.loadFromSavedState(this.props.value);
    }
    else {
      this.setState(state => ({ editorState: this.props.value }));
    }
  }

  static getDerivedStateFromProps(props, prevState){
    if (props.isRaw) {
      // this.loadFromSavedState(this.props.value);
    }
    else {
      return { editorState: props.value };
    }
  }

  loadFromSavedState(content) {
    const editorState = EditorState.createWithContent(
      content ? convertFromRaw(content) : convertFromRaw({blocks:[], entityMap:{}}),
      decorator
    );
    this.setState(state => ({ editorState }));
  }

  render() {
    if(!this.props.value) return <span />
    const { editorState } = this.state;

    
    return (
      <div className="draft-js-editor read-only-editor">
        <Editor placeholder="Type a value..."
          editorState={ editorState || {} }
          onChange={ editorState => this.setState(state => ({ editorState })) }
          plugins={ plugins }
          readOnly={ true }
          spellCheck={ this.props.spellCheck }/>
      </div>
    );
  }
}
export default ReadOnlyEditor;
