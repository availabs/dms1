import React from "react"

import { EditorState, AtomicBlockUtils, Modifier, SelectionState } from 'draft-js';

const ImagePlugin = (options = {}) => {
  const {
    wrappers = []
  } = options;

  const ImageBlock = React.forwardRef(({ blockProps, compProps }, ref) =>
    <img src={ blockProps.src } key={ blockProps.key } { ...compProps } ref={ ref } alt=""/>
  )

  const WrappedBlock = wrappers.reduce((a, c) => c(a), ImageBlock);

  return {
    blockRendererFn: (block, { getEditorState }) => {
      if (block.getType() === "atomic") {
        const contentState = getEditorState().getCurrentContent(),
          entityKey = block.getEntityAt(0);

        if (!entityKey) return null;

        const entity = contentState.getEntity(entityKey),
          type = entity.getType();

        if (type === "IMAGE") {
          return {
            component: WrappedBlock,
            editable: false,
            props: {
              src: entity.getData().src,
              key: entityKey
            }
          };
        }
      }
      return null;
    },
    addImage: (src, editorState) => {
      const contentState = editorState.getCurrentContent()
          .createEntity(
            'IMAGE',
            'IMMUTABLE',
            { src }
          ),
        entityKey = contentState.getLastCreatedEntityKey(),
        newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, 'IMAGE-BLOCK');

      const newContentState = newEditorState.getCurrentContent();

      const beforeKey = newContentState.getSelectionBefore().getStartKey(),
        block = newContentState.getBlockForKey(beforeKey);

      if (block.getLength() > 0) return newEditorState;

      const firstBlock = newContentState.getFirstBlock(),
        lastBlock = newContentState.getLastBlock(),
        selectAll = new SelectionState({ anchorKey: firstBlock.getKey(), focusKey: lastBlock.getKey() }),
        currentContent =  Modifier.replaceWithFragment(
          newContentState,
          selectAll,
          newContentState.getBlockMap().filter(b => b.getKey() !== beforeKey)
        ),
        anchorKey = currentContent.getLastBlock().getKey();

      return EditorState.forceSelection(
        EditorState.set(
          newEditorState,
          { currentContent }
        ),
        new SelectionState({ anchorKey, focusKey: anchorKey })
      )
    }
  }
}
export default ImagePlugin
