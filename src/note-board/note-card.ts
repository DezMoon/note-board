import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import DOMPurify from 'dompurify'
import type { Note } from './types'

@customElement('note-card')
export class NoteCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.75rem;
      background: #fff;
    }

    .title {
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .body {
      color: #374151;
    }

    .controls {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    button {
      border: 1px solid #d1d5db;
      background: #f9fafb;
      padding: 0.35rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
    }
  `

  @property({ type: Object }) note!: Note
  @property({ type: Boolean }) selected = false

  @state() private editing = false
  @state() private draftTitle = ''
  @state() private draftBody = ''

  override connectedCallback(): void {
    super.connectedCallback()
    this.resetDraft()
  }

  private resetDraft() {
    this.draftTitle = this.note?.title ?? ''
    this.draftBody = this.note?.bodyHtml ?? ''
  }

  private enterEdit() {
    this.editing = true
    this.resetDraft()
  }

  private async save() {
    const clean = DOMPurify.sanitize(this.draftBody)
    // Emit a custom event so parent/context can handle saving
    this.dispatchEvent(
      new CustomEvent('note-save', {
        detail: { id: this.note.id, title: this.draftTitle, bodyHtml: clean },
        bubbles: true,
        composed: true,
      }),
    )
    this.editing = false
  }

  private cancel() {
    this.editing = false
    this.resetDraft()
  }

  private handleDelete() {
    this.dispatchEvent(
      new CustomEvent('note-delete', { detail: { id: this.note.id }, bubbles: true, composed: true }),
    )
  }

  protected override render() {
    return this.editing ? this.renderEditor() : this.renderView()
  }

  private renderView() {
    return html`
      <div>
        <h3 class="title">${this.note.title}</h3>
        <div class="body" .innerHTML=${DOMPurify.sanitize(this.note.bodyHtml)}></div>
        <div class="controls">
          <button @click=${() => this.enterEdit()}>Edit</button>
          <button @click=${() => this.handleDelete()}>Delete</button>
        </div>
      </div>
    `
  }

  private renderEditor() {
    return html`
      <div>
        <label>
          Title
          <input
            .value=${this.draftTitle}
            @input=${(e: Event) => (this.draftTitle = (e.target as HTMLInputElement).value)}
          />
        </label>

        <label>
          Body
          <textarea
            .value=${this.draftBody}
            @input=${(e: Event) => (this.draftBody = (e.target as HTMLTextAreaElement).value)}
            rows="6"
          ></textarea>
        </label>

        <div class="controls">
          <button @click=${() => this.save()}>Save</button>
          <button @click=${() => this.cancel()}>Cancel</button>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-card': NoteCard
  }
}
