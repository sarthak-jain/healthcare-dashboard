import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes';
import { formatDate } from '@/lib/utils';

export function PatientNotes({ patientId }: { patientId: number }) {
  const [content, setContent] = useState('');
  const { data: notes, isLoading } = useNotes(patientId);
  const createNote = useCreateNote(patientId);
  const deleteNote = useDeleteNote(patientId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    createNote.mutate(content.trim(), {
      onSuccess: () => setContent(''),
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Clinical Notes</h3>

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a clinical note..."
          rows={3}
          className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!content.trim() || createNote.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createNote.isPending ? 'Adding...' : 'Add Note'}
        </button>
        {createNote.isError && (
          <p className="text-sm text-destructive">Failed to add note. Please try again.</p>
        )}
      </form>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : notes?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes?.map((note) => (
            <div
              key={note.id}
              className="rounded-md border border-border p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDate(note.created_at)}
                </span>
                <button
                  onClick={() => deleteNote.mutate(note.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
