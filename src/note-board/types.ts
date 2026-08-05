export interface Note {
    id: string
    title: string
    bodyHtml: string
    order: number
    updatedAt: string
}

export interface NotesApi {
    list(): Promise<Note[]>

    create (
        input: Pick<Note, 'title' | 'bodyHtml'>,
    ):Promise<Note>

    update(
        id: string,
        patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>
    ):Promise<Note>

    remove(id: string): Promise<void>

}

export type NoteUpdate = Partial<
    Pick<Note, 'title' | 'bodyHtml' | 'order'>
>

export interface NotesContextValue {
    notes: readonly Note[]
    editingNoteId: string | null
    isMutating : boolean

    startEditing(id: string): void
    cancelEditing(): void
    createNote(): Promise<void>

    updateNote(
        id: string,
        patch: NoteUpdate,  
    ): Promise<boolean>

    deleteNote(id: string): Promise<boolean>
}
