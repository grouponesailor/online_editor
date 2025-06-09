import { Node, mergeAttributes } from '@tiptap/core';

export interface ShapeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    shape: {
      setShape: (options: { type: string; svgPath: string }) => ReturnType;
    };
  }
}

export interface ShapeAttributes {
  type: string;
  svgPath: string;
}

export const Shape = Node.create<ShapeOptions>({
  name: 'shape',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  inline: false,

  draggable: true,

  addAttributes() {
    return {
      type: {
        default: null,
        parseHTML: element => element.getAttribute('data-shape-type'),
        renderHTML: attributes => {
          if (!attributes['type']) {
            return {};
          }
          return { 'data-shape-type': attributes['type'] };
        },
      },
      svgPath: {
        default: null,
        parseHTML: element => element.getAttribute('data-shape-class'),
        renderHTML: attributes => {
          if (!attributes['svgPath']) {
            return {};
          }
          return { 'data-shape-class': attributes['svgPath'] };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-shape-type]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const shapeClass = HTMLAttributes['svgPath'] || '';
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-shape-type': HTMLAttributes['type'],
        'data-shape-class': shapeClass,
        class: 'shape-container',
      }),
      ['div', { class: `shape ${shapeClass}` }]
    ];
  },

  addCommands() {
    return {
      setShape:
        (options: ShapeAttributes) =>
        ({ chain, editor }) => {
          const insertShape = chain()
            .insertContent({
              type: this.name,
              attrs: {
                type: options.type,
                svgPath: options.svgPath,
              },
            });

          if (editor.state.selection.anchor === editor.state.doc.content.size) {
            return insertShape.insertContent({ type: 'paragraph' }).run();
          }

          return insertShape.run();
        },
    };
  },
}); 