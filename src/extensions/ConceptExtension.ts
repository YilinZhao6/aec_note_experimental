import { Mark, mergeAttributes } from '@tiptap/core';

export interface ConceptOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    concept: {
      setConcept: (attributes?: { tag?: string }) => ReturnType;
      unsetConcept: () => ReturnType;
    };
  }
}

export const ConceptExtension = Mark.create<ConceptOptions>({
  name: 'concept',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      tag: {
        default: null,
        parseHTML: element => element.getAttribute('data-concept-tag'),
        renderHTML: attributes => {
          if (!attributes.tag) {
            return {};
          }

          return {
            'data-concept-tag': attributes.tag,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-concept-tag]',
        getAttrs: element => {
          if (typeof element === 'string') return {};
          return {
            tag: (element as HTMLElement).getAttribute('data-concept-tag'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setConcept:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetConcept:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});