import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import DOMPurify from 'dompurify';
import { notesContext } from './context';
import type { NotesContextValue, Note } from './context';

@customElement('note-card')
export class NoteCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .card {
      background: #ffffff;
      color: #1a1a1a;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .drag-handle {
      cursor: grab;
      user-select: none;
      touch-action: none;
      font-weight: bold;
      color: #888;
      font-size: 1.2rem;
      padding: 0 0.25rem;
      line-height: 1;
    }
    .drag-handle:active {
      cursor: grabbing;
      color: #007bff;
    }
    .header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #1a1a1a;
      flex-grow: 1;
    }
    .title-input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      border: 1px solid #ccc;
      border-radius: 4px;
      color: #000000;
      background: #ffffff;
    }
    .body {
      color: #4a4a4a;
      line-height: 1.5;
    }
    .editor-container {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.5rem;
      min-height: 100px;
      background: #ffffff;
      color: #000000;
      cursor: text;
    }
    .editor-container .ProseMirror {
      outline: none;
      min-height: 80px;
      color: #000000 !important;
    }
    .editor-container .ProseMirror p {
      color: #000000 !important;
      margin: 0.25rem 0;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    button {
      cursor: pointer;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      background: #f8f9fa;
      color: #333333;
      font-size: 0.9rem;
    }
    button.primary {
      background: #007bff;
      color: #ffffff;
      border-color: #0056b3;
    }
    button.delete {
      background: #ffebee;
      color: #c62828;
      border-color: #ef9a9a;
    }
  `;

  @property({ type: Object }) note!: Note;
  @state() private isEditing = false;
  @state() private editTitle = '';

  @consume({ context: notesContext })
  private context!: NotesContextValue;

  private editor: Editor | undefined;

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('isEditing')) {
      if (this.isEditing) {
        this.updateComplete.then(() => this.initEditor());
      } else {
        this.destroyEditor();
      }
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyEditor();
  }

  private startEditing() {
    this.editTitle = this.note.title;
    this.isEditing = true;
  }

  private initEditor() {
    const container = this.shadowRoot?.querySelector('.editor-container');
    if (!container) return;

    container.innerHTML = '';

    this.editor = new Editor({
      element: container as HTMLElement,
      extensions: [StarterKit],
      content: this.note.bodyHtml,
      autofocus: true,
    });
  }

  private destroyEditor() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = undefined;
    }
  }

  private async handleSave() {
    const rawHtml = this.editor ? this.editor.getHTML() : this.note.bodyHtml;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    const updatedTitle = this.editTitle.trim() || this.note.title;

    if (this.context?.updateNote) {
      await this.context.updateNote(this.note.id, {
        title: updatedTitle,
        bodyHtml: cleanHtml,
      });
    }

    this.isEditing = false;
  }

  private async handleDelete() {
    if (confirm('Are you sure you want to delete this note?')) {
      if (this.context?.deleteNote) {
        await this.context.deleteNote(this.note.id);
      }
    }
  }

  private handleDragHandlePointerDown(e: PointerEvent) {
    if (this.isEditing) return;
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent('note-drag-start', {
        bubbles: true,
        composed: true,
        detail: { pointerEvent: e },
      })
    );
  }

  override render() {
    return html`
      <div class="card">
        ${this.isEditing
          ? html`
              <input
                type="text"
                class="title-input"
                .value=${this.editTitle}
                @input=${(e: Event) =>
                  (this.editTitle = (e.target as HTMLInputElement).value)}
                placeholder="Note Title"
              />
              <div class="editor-container"></div>
              <div class="actions">
                <button class="primary" @click=${this.handleSave}>Save</button>
                <button @click=${() => (this.isEditing = false)}>Cancel</button>
              </div>
            `
          : html`
              <div class="header">
                <span
                  class="drag-handle"
                  title="Drag to reorder"
                  @pointerdown=${this.handleDragHandlePointerDown}
                >⋮⋮</span>
                <h3>${this.note.title}</h3>
              </div>
              <div class="body" .innerHTML=${this.note.bodyHtml}></div>
              <div class="actions">
                <button @click=${this.startEditing}>Edit</button>
                <button class="delete" @click=${this.handleDelete}>Delete</button>
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-card': NoteCard;
  }
}