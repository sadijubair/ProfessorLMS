'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  RemoveFormatting,
} from 'lucide-react';

// ─── Toolbar primitives ───────────────────────────────────────────────────────

function TB({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors focus:outline-none ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxChars?: number;
  className?: string;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  minHeight = '140px',
  maxChars,
  className = '',
}: TiptapEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      UnderlineExt,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      ...(maxChars ? [CharacterCount.configure({ limit: maxChars })] : []),
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // Emit empty string instead of '<p></p>' for empty editor
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: { class: 'tiptap-prose focus:outline-none' },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    const normalised = value || '';
    if (current !== normalised && normalised !== '<p></p>') {
      editor.commands.setContent(normalised);
    }
  }, [value, editor]);

  function setLink() {
    const prev = editor?.getAttributes('link').href ?? '';
    const url = window.prompt('Enter URL:', prev);
    if (url === null) return;
    if (!url) {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  }

  if (!mounted || !editor) {
    return (
      <div
        className={`overflow-hidden rounded-xl border bg-background ${className}`}
        style={{ minHeight: `calc(${minHeight} + 44px)` }}
      >
        <div className="border-b bg-muted/30 px-2 py-1.5 h-[44px]" />
        <div style={{ minHeight }} className="px-3 py-2 text-muted-foreground/40 text-sm italic">
          {placeholder}
        </div>
      </div>
    );
  }

  const charCount = maxChars ? editor.storage.characterCount?.characters?.() : null;

  return (
    <div className={`overflow-hidden rounded-xl border bg-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 ${className}`}>
      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
        {/* Text style */}
        <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <Underline className="h-3.5 w-3.5" />
        </TB>

        <Sep />

        {/* Headings */}
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </TB>

        <Sep />

        {/* Lists */}
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="h-3.5 w-3.5" />
        </TB>

        <Sep />

        {/* Alignment */}
        <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <AlignLeft className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <AlignCenter className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <AlignRight className="h-3.5 w-3.5" />
        </TB>

        <Sep />

        {/* Link */}
        <TB onClick={setLink} active={editor.isActive('link')} title="Insert / edit link">
          <Link2 className="h-3.5 w-3.5" />
        </TB>

        <Sep />

        {/* Clear formatting */}
        <TB onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          <RemoveFormatting className="h-3.5 w-3.5" />
        </TB>

        <Sep />

        {/* History */}
        <TB onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </TB>
        <TB onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
          <Redo2 className="h-3.5 w-3.5" />
        </TB>

        {/* Character count */}
        {charCount !== null && maxChars && (
          <span className={`ml-auto text-[11px] tabular-nums ${charCount > maxChars * 0.9 ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {charCount}/{maxChars}
          </span>
        )}
      </div>

      {/* ── Editor content ────────────────────────────────────── */}
      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  );
}
