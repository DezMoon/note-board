import { provide } from '@lit/context'
import { Task } from '@lit/task'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { notesApi } from './notes-api'
import { notesContext } from './note-context'
import { sortNotesByOrder } from './reorder-notes'
import type { NoteUpdate, NotesApi, NotesContextValue } from './types'
import './note-card'

@customElement('note-board')
export class NoteBoard extends LitElement {
    static override styles = css`
        :host {
        display: block;
        max-width: 800px;
        margin: auto;
        padding: 1rem;
        }

        header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        }

        ul {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 1rem;
        }

        li {
        display: block;
        }

        .message {
        padding: 1rem;
        text-align: center;
        }

        .error {
        color: red;
        }
    `
  @property({ attribute: false })
  api: NotesApi = notesApi

  @state()
  private loaded = false

  @state()
  private errorMessage = ''

  @provide({ context: notesContext })
  @state()
  private contextValue: NotesContextValue = {
    notes: [],
    editingNoteId: null,
    isMutating: false,

    startEditing: (id) =>
      this.startEditing(id),

    cancelEditing: () =>
      this.cancelEditing(),

    createNote: () =>
      this.createNote(),

    updateNote: (id, patch) =>
      this.updateNote(id, patch),

    deleteNote: (id) =>
      this.deleteNote(id),
  }

  private loadNotes = new Task(this, {
    task: async ([api]) => {
      this.loaded = false

      const notes = sortNotesByOrder(
        await api.list(),
      )

      this.setContext({ notes })
      this.loaded = true

      return notes
    },

    args: () => [this.api] as const,
  })

  private setContext(
    changes: Partial<NotesContextValue>,
  ): void {
    this.contextValue = {
      ...this.contextValue,
      ...changes,
    }
  }

  private startEditing(id: string): void {
    this.setContext({
      editingNoteId: id,
    })
  }

  private cancelEditing(): void {
    this.setContext({
      editingNoteId: null,
    })
  }

  private async createNote(): Promise<void> {
    this.setContext({
      isMutating: true,
    })

    this.errorMessage = ''

    try {
      const newNote = await this.api.create({
        title: 'Untitled note',
        bodyHtml: '<p></p>',
      })

      this.setContext({
        notes: sortNotesByOrder([
          ...this.contextValue.notes,
          newNote,
        ]),
        editingNoteId: newNote.id,
      })
    } catch (error) {
      this.showError(error)
    } finally {
      this.setContext({
        isMutating: false,
      })
    }
  }

  private async updateNote(
    id: string,
    patch: NoteUpdate,
  ): Promise<boolean> {
    this.setContext({
      isMutating: true,
    })

    this.errorMessage = ''

    try {
      const updatedNote =
        await this.api.update(id, patch)

      const notes = this.contextValue.notes.map(
        (note) =>
          note.id === id ? updatedNote : note,
      )

      this.setContext({
        notes: sortNotesByOrder(notes),
      })

      return true
    } catch (error) {
      this.showError(error)
      return false
    } finally {
      this.setContext({
        isMutating: false,
      })
    }
  }

  private async deleteNote(
    id: string,
  ): Promise<boolean> {
    this.setContext({
      isMutating: true,
    })

    this.errorMessage = ''

    try {
      await this.api.remove(id)

      this.setContext({
        notes: this.contextValue.notes.filter(
          (note) => note.id !== id,
        ),
        editingNoteId: null,
      })

      return true
    } catch (error) {
      this.showError(error)
      return false
    } finally {
      this.setContext({
        isMutating: false,
      })
    }
  }

  private showError(error: unknown): void {
    this.errorMessage =
      error instanceof Error
        ? error.message
        : 'Something went wrong.'
  }

  private retry(): void {
    void this.loadNotes.run()
  }

  private renderNotes() {
    if (this.contextValue.notes.length === 0) {
      return html`
        <p class="message">No notes available.</p>
      `
    }

    return html`
      <ul>
        ${this.contextValue.notes.map(
          (note) => html`
            <li>
              <note-card .note=${note}></note-card>
            </li>
          `,
        )}
      </ul>
    `
  }

  override render() {
    return html`
      <header>
        <h1>Note Board</h1>

        <button
          type="button"
          ?disabled=${!this.loaded || this.contextValue.isMutating}
          @click=${() => void this.contextValue.createNote()}
        >
          Add note
        </button>
      </header>

      ${this.errorMessage
        ? html`
            <p class="error" role="alert">
              ${this.errorMessage}
            </p>
          `
        : ''}

      ${this.loadNotes.render({
        initial: () => html`
          <p class="message">Preparing notes...</p>
        `,

        pending: () => html`
          <p class="message">Loading notes...</p>
        `,

        complete: () => this.renderNotes(),

        error: (error) => html`
          <div class="message error">
            <p>
              ${error instanceof Error
                ? error.message
                : 'Could not load notes.'}
            </p>

            <button type="button" @click=${this.retry}>
              Retry
            </button>
          </div>
        `,
      })}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-board': NoteBoard
  }
}
