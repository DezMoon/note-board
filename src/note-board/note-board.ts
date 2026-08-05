import { Task } from '@lit/task'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {notesApi} from './notes-api'
import { sortNotesByOrder } from './reorder-notes'
import type { Note, NotesApi } from './types'

@customElement('note-board')
export class NoteBoard extends LitElement {
    static override styles = css`
        :host {
        display: block
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
        border: 1px solid #ccc;
        padding: 1rem;
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
  private notes: Note[] = []

  private loadNotes = new Task(this, {
    task: async ([api]) => {
      const notes = await api.list()

      this.notes = sortNotesByOrder(notes)

      return this.notes
    },

    args: () => [this.api] as const,
  })

  private retry(): void {
    void this.loadNotes.run()
  }

  private renderNotes() {
    if (this.notes.length === 0) {
      return html`
        <p class="message">No notes available.</p>
      `
    }

    return html`
      <ul>
        ${this.notes.map(
          (note) => html`
            <li>
              <h2>${note.title}</h2>
              <p>${note.bodyHtml}</p>
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

        <button type="button" disabled>
          Add note
        </button>
      </header>

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
