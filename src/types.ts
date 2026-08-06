export interface Note {
  id: string;
  title: string;
  bodyHtml: string;        // sanitized rich-text output
  order: number;
  updatedAt: string;       // ISO date
}

export interface NotesApi {
  list(): Promise<Note[]>;
  create(input: Pick<Note, 'title' | 'bodyHtml'>): Promise<Note>;
  update(id: string, patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>): Promise<Note>;
  remove(id: string): Promise<void>;
}