export interface Note {
  id: string
  title: string
  bodyHtml: string
  order: number
  updatedAt: string
}

export interface NotesApi {
  list(): Promise<Note[]>
  create(input: Pick<Note, 'title' | 'bodyHtml'>): Promise<Note>
  update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>,
  ): Promise<Note>
  remove(id: string): Promise<void>
}

export type CreateNoteInput = Pick<Note, 'title' | 'bodyHtml'>
export type UpdateNotePatch = Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>