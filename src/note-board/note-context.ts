import { createContext } from '@lit/context'
import type { NotesContextValue } from './types'

export const notesContext =
  createContext<NotesContextValue>(
    Symbol('notes-context'),
  )