import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task';
import { notesContext } from './context';
import type { NotesContextValue, Note } from './context';
import './note-card';

@customElement('note-board')
export class NoteBoard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      font-family: system-ui, sans-serif;
    }
    header {
      margin-bottom: 1.5rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .card-wrapper {
      transition: transform 0.2s ease, opacity 0.2s ease;
      border-radius: 8px;
    }
    .card-wrapper.drag-over {
      outline: 2px dashed #007bff;
      outline-offset: 4px;
    }
    .card-wrapper.dragging {
      opacity: 0.4;
    }
    .loading, .error {
      padding: 2rem;
      text-align: center;
    }
    .error {
      color: #d32f2f;
    }
    button.add-btn {
      cursor: pointer;
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      border: 1px solid #0056b3;
      background: #007bff;
      color: #ffffff;
      font-weight: 600;
    }
  `;

  @state() private notes: Note[] = [];
  @state() private draggedIndex: number | null = null;
  @state() private dragOverIndex: number | null = null;

  @provide({ context: notesContext })
  private contextValue: NotesContextValue = {
    notes: [],
    loading: true,
    error: null,
    createNote: this.handleCreate.bind(this),
    updateNote: this.handleUpdate.bind(this),
    deleteNote: this.handleDelete.bind(this),
    reorderNotes: this.handleReorder.bind(this),
    retry: () => this.apiTask.run(),
  };

  private apiTask = new Task(this, {
    task: async () => {
      const res = await fetch('/api/notes');
      if (!res.ok) {
        throw new Error(`Failed to fetch notes: ${res.statusText}`);
      }
      const data: Note[] = await res.json();
      return data.sort((a, b) => a.order - b.order);
    },
    args: () => []
  });

  private async handleCreate(title: string, bodyHtml: string) {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bodyHtml }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.statusText}`);
      this.apiTask.run();
    } catch (err) {
      console.error(err);
    }
  }

  private async handleUpdate(id: string, patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
      this.apiTask.run();
    } catch (err) {
      console.error(err);
    }
  }

  private async handleDelete(id: string) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
      this.apiTask.run();
    } catch (err) {
      console.error(err);
    }
  }

  private async handleReorder(oldIndex: number, newIndex: number) {
    if (oldIndex === newIndex) return;

    const reordered = [...this.notes];
    const [movedNote] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedNote);

    const updatedNotes = reordered.map((note, idx) => ({
      ...note,
      order: idx + 1,
    }));

    // Optimistically update UI
    this.notes = updatedNotes;

    // Persist position changes to the API
    await Promise.all(
      updatedNotes.map((note) =>
        fetch(`/api/notes/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: note.order }),
        })
      )
    );
  }

  // --- Drag and Drop Handlers ---
  private handleDragStart(e: DragEvent, index: number) {
    this.draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }

  private handleDragOver(e: DragEvent, index: number) {
    e.preventDefault(); // Necessary to allow dropping
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (this.dragOverIndex !== index) {
      this.dragOverIndex = index;
    }
  }

  private handleDragLeave(index: number) {
    if (this.dragOverIndex === index) {
      this.dragOverIndex = null;
    }
  }

  private handleDrop(e: DragEvent, index: number) {
    e.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      this.handleReorder(this.draggedIndex, index);
    }
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  private handleDragEnd() {
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  override render() {
    return this.apiTask.render({
      pending: () => html`<div class="loading">Loading notes...</div>`,
      error: (err) => html`
        <div class="error">
          <p>Failed to load notes: ${(err as Error).message}</p>
          <button class="add-btn" @click=${() => this.apiTask.run()}>Retry</button>
        </div>
      `,
      complete: (fetchedNotes) => {
        this.notes = fetchedNotes;
        this.contextValue = { ...this.contextValue, notes: fetchedNotes, loading: false };

        return html`
          <header>
            <button class="add-btn" @click=${() => this.handleCreate('New Note', '<p>Edit me...</p>')}>
              + Add Note
            </button>
          </header>
          
          <div class="grid">
            ${this.notes.length === 0
              ? html`<p>No notes available. Create one to get started!</p>`
              : this.notes.map(
                  (note, index) => html`
                    <div
                      class="card-wrapper ${this.draggedIndex === index ? 'dragging' : ''} ${this.dragOverIndex === index ? 'drag-over' : ''}"
                      draggable="true"
                      @dragstart=${(e: DragEvent) => this.handleDragStart(e, index)}
                      @dragover=${(e: DragEvent) => this.handleDragOver(e, index)}
                      @dragleave=${() => this.handleDragLeave(index)}
                      @drop=${(e: DragEvent) => this.handleDrop(e, index)}
                      @dragend=${this.handleDragEnd}
                    >
                      <note-card .note=${note}></note-card>
                    </div>
                  `
                )}
          </div>
        `;
      }
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-board': NoteBoard;
  }
}