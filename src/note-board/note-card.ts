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
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #1a1a1a;
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
      background: #fff;
      color: #000;
    }
    .editor-container .ProseMirror {
      outline: none;
      min-height: 80px;
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
      font-size: 0.9rem;
    }
    button.delete {
      background: #ffebee;
      color: #c62828;
      border-color: #ef9a9a;
    }
  `;

  @property({ type: Object }) note!: Note;
  @state() private isEditing = false;

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

  private initEditor() {
    const container = this.shadowRoot?.querySelector('.editor-container');
    if (!container) return;

    this.editor = new Editor({
      element: container as HTMLElement,
      extensions: [StarterKit],
      content: this.note.bodyHtml,
    });
  }

  private destroyEditor() {
    this.editor?.destroy();
    this.editor = undefined;
  }

  private async handleSave() {
    if (!this.editor) return;
    const rawHtml = this.editor.getHTML();
    const cleanHtml = DOMPurify.sanitize(rawHtml);

    await this.context.updateNote(this.note.id, { bodyHtml: cleanHtml });
    this.isEditing = false;
  }

  private async handleDelete() {
    if (confirm('Are you sure you want to delete this note?')) {
      await this.context.deleteNote(this.note.id);
    }
  }

  override render() {
    return html`
      <div class="card">
        <div class="header">
          <h3>${this.note.title}</h3>
        </div>

        ${this.isEditing
          ? html`
              <div class="editor-container"></div>
              <div class="actions">
                <button @click=${this.handleSave}>Save</button>
                <button @click=${() => (this.isEditing = false)}>Cancel</button>
              </div>
            `
          : html`
              <div class="body" .innerHTML=${this.note.bodyHtml}></div>
              <div class="actions">
                <button @click=${() => (this.isEditing = true)}>Edit</button>
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