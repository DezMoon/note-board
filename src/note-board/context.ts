import { createContext } from '@lit/context'
import type { Note } from './types'

export interface NoteBoardContextValue {
  notes: Note[]
  selectedNoteId?: string
  isLoading: boolean
  error: string | null
  loadNotes: () => Promise<void>
  createNote: (input: Pick<Note, 'title' | 'bodyHtml'>) => Promise<Note>
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>
  ) => Promise<Note>
  deleteNote: (id: string) => Promise<void>
  reorderNotes: (sourceIndex: number, targetIndex: number) => Promise<void>
  selectNote: (id: string | undefined) => void
}

export const noteBoardContext =
  createContext<NoteBoardContextValue>('note-board-context')