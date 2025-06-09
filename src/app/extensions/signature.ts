import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

interface SignatureOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    signature: {
      insertSignature: (content: string) => ReturnType;
    };
  }
}

export const Signature = Extension.create<SignatureOptions>({
  name: 'signature',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      insertSignature:
        (content: string) =>
        ({ commands }) => {
          const signatureHtml = `<div class="signature-block" contenteditable="false">${content}</div>`;
          return commands.insertContent(signatureHtml);
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('signature'),
        props: {
          decorations: (state) => {
            // Add any signature-specific decorations here if needed
            return null;
          },
        },
      }),
    ];
  },
}); 