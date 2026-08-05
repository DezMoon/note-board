import { consume } from '@lit/context'
import { css, html, LitElement } from 'lit'
import {
  customElement,
  property,
} from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { notesContext } from './note-context'
import { sanitizeNoteHtml } from './sanitize-html'
import type {
  Note,
  NotesContextValue,
} from './types'
import type { NoteEditor } from './note-editor'
import './note-editor'

@customElement('note-card')
export class NoteCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: 1px solid #ccc;
      padding: 1rem;
      background: white;
      color: #222;
    }

    h2 {
      margin-top: 0;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .body {
      overflow-wrap: anywhere;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `

  @property({ attribute: false })
  note!: Note

  @consume({
    context: notesContext,
    subscribe: true,
  })
  @property({ attribute: false })
  context?: NotesContextValue

  private async save(): Promise<void> {
    if (!this.context) {
      return
    }

    const titleInput =
      this.renderRoot.querySelector<HTMLInputElement>(
        'input',
      )

    const editor =
      this.renderRoot.querySelector<NoteEditor>(
        'note-editor',
      )

    if (!titleInput || !editor) {
      return
    }

    const title =
      titleInput.value.trim() || 'Untitled note'

    const bodyHtml = sanitizeNoteHtml(
      editor.getHtml(),
    )

    const success =
      await this.context.updateNote(
        this.note.id,
        {
          title,
          bodyHtml,
        },
      )

    if (success) {
      this.context.cancelEditing()
    }
  }

  private async deleteNote(): Promise<void> {
    await this.context?.deleteNote(this.note.id)
  }

  override render() {
    const isEditing =
      this.context?.editingNoteId === this.note.id

    if (isEditing) {
      return html`
        <input
          aria-label="Note title"
          .value=${this.note.title}
        />

        <note-editor
          .value=${this.note.bodyHtml}
        ></note-editor>

        <div class="actions">
          <button
            type="button"
            ?disabled=${this.context?.isMutating}
            @click=${() => void this.save()}
          >
            Save
          </button>

          <button
            type="button"
            @click=${() =>
              this.context?.cancelEditing()}
          >
            Cancel
          </button>
        </div>
      `
    }

    return html`
      <article>
        <h2>${this.note.title}</h2>

        <div class="body">
          ${unsafeHTML(
            sanitizeNoteHtml(this.note.bodyHtml),
          )}
        </div>

        <div class="actions">
          <button
            type="button"
            ?disabled=${this.context?.isMutating}
            @click=${() =>
              this.context?.startEditing(
                this.note.id,
              )}
          >
            Edit
          </button>

          <button
            type="button"
            ?disabled=${this.context?.isMutating}
            @click=${() =>
              void this.deleteNote()}
          >
            Delete
          </button>
        </div>
      </article>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-card': NoteCard
  }
}