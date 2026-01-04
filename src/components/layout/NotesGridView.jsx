import { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import NoteCardPreview from './NoteCardPreview';

export default function NotesGridView({ notes, selectedNoteKey, currentStorageKey }) {
  const noteRefs = useRef({});

  // Auto-scroll to selected note
  useEffect(() => {
    if (selectedNoteKey && noteRefs.current[selectedNoteKey]) {
      noteRefs.current[selectedNoteKey].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedNoteKey]);

  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <FileText className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No notes found</p>
        <p className="text-xs mt-1">Start taking notes from your city dashboard</p>
      </div>
    );
  }

  return (
    <div
      className="
        columns-1 md:columns-2 lg:columns-3
        gap-4
      "
      style={{
        columnFill: 'balance',
      }}
    >
      {notes.map((note) => {
        const noteKey = note.storageKey || note.id;
        const isCurrentNote = currentStorageKey && noteKey === currentStorageKey;
        return (
          <NoteCardPreview
            key={noteKey}
            ref={(el) => {
              noteRefs.current[noteKey] = el;
            }}
            note={note}
            isSelected={noteKey === selectedNoteKey}
            defaultExpanded={isCurrentNote}
          />
        );
      })}
    </div>
  );
}
