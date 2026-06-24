import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';

type TiptapSectionEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

/**
 * AUTODOC rich text editor.
 *
 * This replaces the old contentEditable + document.execCommand editor.
 *
 * Important:
 * - The exporter relies on this component producing clean HTML.
 * - Lists should be real <ul>/<ol>/<li> tags.
 * - Tables should be real <table>/<tr>/<td>/<th> tags.
 * - The Word generator then converts that HTML into Word XML.
 */
export default function TiptapSectionEditor({
  content,
  onChange,
}: TiptapSectionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Table.configure({
        resizable: true,
      }),
      Placeholder.configure({
  placeholder: 'Start writing...',
}),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  /**
   * Keeps Tiptap in sync if AUTODOC loads saved content or switches recipes.
   *
   * Without this, the editor could keep showing stale content after the parent
   * React state changes.
   */
  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = content || '<p></p>';

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, {
  emitUpdate: false,
});
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const buttonClass =
    'px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-100';

  const activeButtonClass =
    'px-2 py-1 text-xs border border-orange-500 rounded bg-orange-50 text-orange-700';

  return (
    <div className="border border-gray-300 rounded bg-white">
      <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2 bg-gray-50">
        <button
          type="button"
          className={editor.isActive('bold') ? activeButtonClass : buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
        >
          B
        </button>

        <button
          type="button"
          className={editor.isActive('italic') ? activeButtonClass : buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
        >
          I
        </button>

        <button
          type="button"
          className={
            editor.isActive('underline') ? activeButtonClass : buttonClass
          }
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
        >
          U
        </button>

        <span className="mx-1 h-6 border-l border-gray-300" />

        <button
          type="button"
          className={
            editor.isActive('heading', { level: 2 })
              ? activeButtonClass
              : buttonClass
          }
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
        >
          H2
        </button>

        <button
          type="button"
          className={
            editor.isActive('heading', { level: 3 })
              ? activeButtonClass
              : buttonClass
          }
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
        >
          H3
        </button>

        <span className="mx-1 h-6 border-l border-gray-300" />

        <button
          type="button"
          className={
            editor.isActive('bulletList') ? activeButtonClass : buttonClass
          }
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
        >
          • List
        </button>

        <button
          type="button"
          className={
            editor.isActive('orderedList') ? activeButtonClass : buttonClass
          }
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
        >
          1. List
        </button>

        <span className="mx-1 h-6 border-l border-gray-300" />

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor
              .chain()
              .focus()
              .insertTable({ rows: 4, cols: 4, withHeaderRow: true })
              .run();
          }}
        >
          Insert table
        </button>

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().addRowAfter().run();
          }}
        >
          + Row
        </button>

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().addColumnAfter().run();
          }}
        >
          + Col
        </button>

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().deleteRow().run();
          }}
        >
          − Row
        </button>

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().deleteColumn().run();
          }}
        >
          − Col
        </button>

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().deleteTable().run();
          }}
        >
          Delete table
        </button>

        <span className="mx-1 h-6 border-l border-gray-300" />

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
        >
          Undo
        </button>

        <button
          type="button"
          className={buttonClass}
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
        >
          Redo
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="autodoc-tiptap-editor min-h-[180px] p-3 text-sm leading-relaxed focus:outline-none"
      />
    </div>
  );
}
