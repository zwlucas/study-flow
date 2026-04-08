"use client";

import { BlockNoteView } from "@blocknote/ariakit";
import "@blocknote/ariakit/style.css";
import { FilePanelController, useCreateBlockNote } from "@blocknote/react";
import { useCallback, useEffect } from "react";

import { NotesFilePanel } from "@/features/notes/notes-file-panel";

/** Guarda o ficheiro na nota como data URL (funciona offline e persiste no localStorage). */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o ficheiro"));
    reader.readAsDataURL(file);
  });
}

type NotesBlockEditorProps = {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
};

export function NotesBlockEditor({ initialMarkdown, onMarkdownChange }: NotesBlockEditorProps) {
  const uploadFile = useCallback(async (file: File) => readFileAsDataUrl(file), []);

  const editor = useCreateBlockNote({ uploadFile }, [uploadFile]);

  useEffect(() => {
    const blocks = editor.tryParseMarkdownToBlocks(initialMarkdown || "");
    editor.replaceBlocks(editor.document, blocks);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount ao mudar nota (key no pai)
  }, [editor]);

  useEffect(() => {
    return editor.onChange(() => {
      onMarkdownChange(editor.blocksToMarkdownLossy(editor.document));
    });
  }, [editor, onMarkdownChange]);

  return (
    <div className="notes-bn-root min-h-[min(50vh,520px)] w-full">
      <BlockNoteView editor={editor} theme="dark" filePanel={false} className="notes-bn-view [&_.bn-editor]:bg-transparent!">
        <FilePanelController filePanel={NotesFilePanel} />
      </BlockNoteView>
    </div>
  );
}
