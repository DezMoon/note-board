import type { Note, NotesApi } from './types';

export class FetchNotesApi implements NotesApi {
  async list(): Promise<Note[]> {
    const res = await fetch('/api/notes');
    if (!res.ok) {
      throw new Error(`Failed to load notes (${res.status} ${res.statusText})`);
    }
    return (await res.json()) as Note[];
  }

  async create(input: Pick<Note, 'title' | 'bodyHtml'>): Promise<Note> {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`Failed to create note (${res.status} ${res.statusText})`);
    }
    return (await res.json()) as Note;
  }

  async update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>
  ): Promise<Note> {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error(`Failed to update note (${res.status} ${res.statusText})`);
    }
    return (await res.json()) as Note;
  }

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete note (${res.status} ${res.statusText})`);
    }
  }
}

export const defaultNotesApi = new FetchNotesApi();