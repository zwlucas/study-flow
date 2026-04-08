import { Suspense } from "react";
import { NotesView } from "@/features/notes/notes-view";

function NotesFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Carregando notas…
    </div>
  );
}

export default function NotesPage() {
  return (
    <div className="min-h-[calc(100dvh-4.5rem)] w-full bg-zinc-950 md:min-h-[calc(100dvh-2.5rem)]">
      <Suspense fallback={<NotesFallback />}>
        <NotesView />
      </Suspense>
    </div>
  );
}
