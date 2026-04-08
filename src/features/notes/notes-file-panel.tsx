"use client";

import {
  EmbedTab,
  type FilePanelProps,
  useBlockNoteEditor,
  useComponentsContext,
} from "@blocknote/react";
import { FolderUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";

const TAB_UPLOAD = "Do computador";
const TAB_URL = "Ligação (URL)";

function NotesUploadTab({
  blockId,
  setLoading,
}: FilePanelProps & {
  setLoading: (v: boolean) => void;
}) {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);

  const accept = useMemo(() => {
    const block = editor.getBlock(blockId);
    if (!block) return "*/*";
    const spec = editor.schema.blockSpecs[block.type];
    return spec.implementation.meta?.fileBlockAccept?.length
      ? spec.implementation.meta.fileBlockAccept.join(",")
      : "*/*";
  }, [editor, blockId]);

  const processFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file || !editor.uploadFile) return;
      setLoading(true);
      setUploadFailed(false);
      try {
        let updateData = await editor.uploadFile(file, blockId);
        if (typeof updateData === "string") {
          updateData = {
            props: {
              name: file.name,
              url: updateData,
            },
          };
        }
        editor.updateBlock(blockId, updateData);
      } catch {
        setUploadFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [blockId, editor, setLoading],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  if (!editor.getBlock(blockId)) {
    return null;
  }

  return (
    <Components.FilePanel.TabPanel className="bn-tab-panel">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 transition-colors",
          isDragging
            ? "border-sky-500/70 bg-sky-950/30"
            : "border-zinc-600/80 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/70",
        ].join(" ")}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            void processFile(file);
            e.target.value = "";
          }}
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300">
          <FolderUp className="h-5 w-5" aria-hidden />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-zinc-200">Largue o ficheiro aqui</p>
          <p className="mt-1 text-[11px] text-zinc-500">ou clique para escolher no disco</p>
        </div>
        <span className="rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300">
          Escolher ficheiro…
        </span>
      </div>
      {uploadFailed ? (
        <p className="mt-2 text-center text-[11px] text-red-400/90">Não foi possível carregar. Tente outro ficheiro.</p>
      ) : null}
    </Components.FilePanel.TabPanel>
  );
}

/**
 * Painel de média/ficheiros: separadores em PT, zona de arrastar e botão explícito
 * em vez do input nativo exposto no popover predefinido.
 */
export function NotesFilePanel(props: FilePanelProps) {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const [loading, setLoading] = useState(false);

  const tabs = useMemo(() => {
    const list: { name: string; tabPanel: ReactNode }[] = [];
    if (editor.uploadFile !== undefined) {
      list.push({
        name: TAB_UPLOAD,
        tabPanel: <NotesUploadTab {...props} setLoading={setLoading} />,
      });
    }
    list.push({
      name: TAB_URL,
      tabPanel: <EmbedTab blockId={props.blockId} />,
    });
    return list;
  }, [editor.uploadFile, props.blockId, setLoading]);

  const [openTab, setOpenTab] = useState<string>(() =>
    editor.uploadFile !== undefined ? TAB_UPLOAD : TAB_URL,
  );

  useEffect(() => {
    setOpenTab(editor.uploadFile !== undefined ? TAB_UPLOAD : TAB_URL);
  }, [props.blockId, editor.uploadFile]);

  return (
    <div className="notes-file-panel-shell relative min-w-[min(100vw-1.5rem,320px)] max-w-[380px]">
      <Components.FilePanel.Root
        className="bn-panel notes-file-panel-root"
        defaultOpenTab={openTab}
        openTab={openTab}
        setOpenTab={setOpenTab}
        tabs={tabs}
        loading={loading}
      />
      {loading ? (
        <div className="pointer-events-none absolute inset-0 z-1 flex items-center justify-center rounded-xl bg-zinc-950/55 backdrop-blur-[2px]">
          <span className="text-[11px] font-medium text-zinc-300">A carregar…</span>
        </div>
      ) : null}
    </div>
  );
}
