import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DataChipComponent from '../DataChipComponent';

export const DataChipNode = Node.create({
  name: 'dataChip',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      value: { default: '' },
      label: { default: '' },
      source: { default: '' },
      timestamp: { default: '' },
      type: { default: 'default' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'data-chip',
        getAttrs: (dom) => ({
          value: dom.getAttribute('data-value'),
          label: dom.getAttribute('data-label'),
          source: dom.getAttribute('data-source'),
          timestamp: dom.getAttribute('data-timestamp'),
          type: dom.getAttribute('data-type'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'data-chip',
      mergeAttributes(HTMLAttributes, {
        'data-value': HTMLAttributes.value,
        'data-label': HTMLAttributes.label,
        'data-source': HTMLAttributes.source,
        'data-timestamp': HTMLAttributes.timestamp,
        'data-type': HTMLAttributes.type,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DataChipComponent);
  },
});
