import React from "react"

import linkifyIt from "linkify-it"
import tlds from "tlds"

const linkify = linkifyIt()
  .tlds(tlds)
  .add("ftp", null)
  .set({ fuzzyIP: true });

const Link = ({ store, options, decoratedText, children, ...props }) => {
  const links = linkify.match(decoratedText),
    href = links && links.pop().url;

  const {
    target = "_blank"
  } = options;

  return store.getReadOnly() ?
    <a className="text-blue-500 underline cursor-pointer"
      href={ href } target={ target }>
      { children }
    </a>
  :
    <div className="inline-block relative hoverable">
      <div className="text-blue-500 underline cursor-pointer">
        { children }
      </div>
      <div className="read-only-link-tooltip show-on-hover show-on-bottom pb-1 px-2 bg-gray-200 absolute z-50 rounded"
        onClick={ e => e.stopPropagation() } contentEditable={ false }>
        <a className="text-blue-500 underline cursor-pointer"
          href={ href } target={ target }>
          { href }
        </a>
      </div>
    </div>
}

const strategy = (contentBlock, callback) => {
  const text = contentBlock.getText(),
    links = linkify.match(text);
  links && links.forEach(({ index, lastIndex }) => callback(index, lastIndex));
}

const linkifyitPlugin = (options = {}) => {
  const store = {};
  return {
    initialize: ({ getReadOnly }) => {
      store.getReadOnly = getReadOnly;
    },
    decorators: [
      { strategy,
        component: props => <Link { ...props } store={ store } options={ options }/>
      }
    ]
  }
}
export default linkifyitPlugin
