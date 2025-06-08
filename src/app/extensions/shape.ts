import { Node, mergeAttributes } from '@tiptap/core';

export interface ShapeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    shape: {
      setShape: (options: { type: string; svg: string }) => ReturnType;
    };
  }
}

export interface ShapeAttributes {
  type: string;
  svg: string;
}

export const Shape = Node.create<ShapeOptions>({
  name: 'shape',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      type: {
        default: null,
      },
      svg: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-svg'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes['svg']) {
            return {};
          }
          return { 'data-svg': attributes['svg'] };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="shape"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(
      this.options.HTMLAttributes,
      HTMLAttributes,
      { 'data-type': 'shape', class: 'shape-container' }
    );

    return ['div', attrs, ['div', { 
      class: 'shape',
      innerHTML: HTMLAttributes['svg'] || ''
    }]];
  },

  addCommands() {
    return {
      setShape:
        (options: ShapeAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
}); 