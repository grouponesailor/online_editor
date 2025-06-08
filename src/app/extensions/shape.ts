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

  group: 'inline',

  inline: true,

  selectable: true,

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
        parseHTML: element => element.querySelector('svg')?.outerHTML || null,
        renderHTML: attributes => {
          if (!attributes['svgPath']) {
            return {};
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-shape-type]',
        getAttrs: element => {
          if (typeof element === 'string') return {};
          const el = element as HTMLElement;
          return {
            type: el.getAttribute('data-shape-type'),
            svgPath: el.querySelector('svg')?.outerHTML || null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(this.options.HTMLAttributes, {
      'data-shape-type': HTMLAttributes['type'],
      class: 'shape-container',
    });

    // Create the container div
    const container = document.createElement('div');
    Object.entries(attrs).forEach(([key, value]) => {
      container.setAttribute(key, value as string);
    });

    // Create the shape div
    const shape = document.createElement('div');
    shape.className = 'shape';

    // Create the content div and insert the SVG
    const content = document.createElement('div');
    content.className = 'shape-content';
    
    // Only set innerHTML if we have valid SVG content
    if (HTMLAttributes['svgPath'] && typeof HTMLAttributes['svgPath'] === 'string') {
      // Ensure we're actually inserting SVG content
      const svgContent = HTMLAttributes['svgPath'].trim();
      if (svgContent.startsWith('<svg') && svgContent.endsWith('</svg>')) {
        content.innerHTML = svgContent;
        
        // Get the inserted SVG element and ensure it has proper attributes
        const svg = content.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.display = 'block';
        }
      } else {
        console.error('Invalid SVG content:', svgContent);
      }
    }

    // Assemble the elements
    shape.appendChild(content);
    container.appendChild(shape);

    return container;
  },

  addCommands() {
    return {
      setShape:
        (options: ShapeAttributes) =>
        ({ chain }) => {
          console.log('Setting shape with options:', options);
          if (!options.svgPath || typeof options.svgPath !== 'string') {
            console.error('Invalid SVG path provided:', options.svgPath);
            return false;
          }
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                type: options.type,
                svgPath: options.svgPath,
              },
            })
            .run();
        },
    };
  },
}); 