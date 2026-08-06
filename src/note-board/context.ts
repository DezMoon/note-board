import { createContext } from '@lit/context';

export interface Note {
  id: string;
  title: string;
  bodyHtml: string;
  order: number;
  updatedAt: string;
}

export interface NotesContextValue {
  notes: Note[];
  loading: boolean;
  error: Error | null;
  createNote: (title: string, bodyHtml: string) => Promise<void>;
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  reorderNotes: (oldIndex: number, newIndex: number) => Promise<void>;
  retry: () => void;
}

export const notesContext = createContext<NotesContextValue>(Symbol('notes-context'));