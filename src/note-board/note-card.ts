import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { Note } from './types'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { sanitizeHtml } from './sanitizer'

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
  private editorInstance: Editor | null = null

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
    // ensure latest editor HTML is captured
    if (this.editorInstance) this.draftBody = this.editorInstance.getHTML()
    const clean = sanitizeHtml(this.draftBody)
    // Emit a custom event so parent/context can handle saving
    this.dispatchEvent(
      new CustomEvent('note-save', {
        detail: { id: this.note.id, title: this.draftTitle, bodyHtml: clean },
        bubbles: true,
        composed: true,
      }),
    )
    this.editing = false
    this.destroyEditor()
  }

  private cancel() {
    this.editing = false
    this.resetDraft()
    this.destroyEditor()
  }

  private handleDelete() {
    this.dispatchEvent(
      new CustomEvent('note-delete', { detail: { id: this.note.id }, bubbles: true, composed: true }),
    )
  }

  private createEditor() {
    const container = this.renderRoot.querySelector('.tiptap') as HTMLElement | null
    if (!container) return

    this.editorInstance = new Editor({
      element: container,
      content: this.draftBody,
      extensions: [StarterKit, Placeholder.configure({ placeholder: 'Write something...' }), Link],
      onUpdate: ({ editor }) => {
        this.draftBody = editor.getHTML()
      },
    })
  }

  private destroyEditor() {
    if (this.editorInstance) {
      this.editorInstance.destroy()
      this.editorInstance = null
    }
  }

  protected override render() {
    return this.editing ? this.renderEditor() : this.renderView()
  }

  private renderView() {
    return html`
      <div>
        <h3 class="title">${this.note.title}</h3>
        <div class="body" .innerHTML=${sanitizeHtml(this.note.bodyHtml)}></div>
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
          <div class="tiptap"></div>
        </label>

        <div class="controls">
          <button @click=${() => this.save()}>Save</button>
          <button @click=${() => this.cancel()}>Cancel</button>
        </div>
      </div>
    `
  }

  protected override updated(changedProps: Map<string, unknown>) {
    super.updated(changedProps)
    if (changedProps.has('editing') && this.editing) {
      // Rendered edit UI — create TipTap editor
      this.createEditor()
    }
  }

  override disconnectedCallback(): void {
    this.destroyEditor()
    super.disconnectedCallback()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-card': NoteCard
  }
}
