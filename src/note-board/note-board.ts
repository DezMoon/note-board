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
      padding: 1rem;
      font-family: system-ui, sans-serif;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .loading, .error {
      padding: 2rem;
      text-align: center;
    }
    .error {
      color: #d32f2f;
    }
    button {
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
  `;

    @state() private notes: Note[] = [];

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
            console.error('Failed to create note:', err);
            alert('Failed to create note. Please try again.');
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
            console.error('Failed to update note:', err);
            alert('Failed to update note. Please try again.');
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
            console.error('Failed to delete note:', err);
            alert('Failed to delete note. Please try again.');
        }
    }

    private async handleReorder(oldIndex: number, newIndex: number) {
        // Avoid unused parameter warning until implementation
        void oldIndex;
        void newIndex;
    }

    override render() {
        return this.apiTask.render({
            pending: () => html`<div class="loading">Loading notes...</div>`,
            error: (err) => html`
        <div class="error">
          <p>Failed to load notes: ${(err as Error).message}</p>
          <button @click=${() => this.apiTask.run()}>Retry</button>
        </div>
      `,
            complete: (fetchedNotes) => {
                this.notes = fetchedNotes;
                this.contextValue = { ...this.contextValue, notes: fetchedNotes, loading: false };

                return html`
          <header>
            <button @click=${() => this.handleCreate('New Note', '<p>Edit me...</p>')}>
              + Add Note
            </button>
          </header>
          
          <div class="grid">
            ${this.notes.length === 0
                        ? html`<p>No notes available. Create one to get started!</p>`
                        : this.notes.map((note) => html`
                  <div class="card-stub">
                    <h4>${note.title}</h4>
                  </div>
                `)}
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