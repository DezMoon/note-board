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
      border-radius: 8px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      touch-action: none;
    }
    .card-wrapper.dragging {
      opacity: 0.5;
      transform: scale(0.98);
      outline: 2px dashed #007bff;
      outline-offset: 4px;
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
  @state() private activeDragIndex: number | null = null;
  private activePointerId: number | null = null;

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
    if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0) return;

    this.swapNotesRealtime(oldIndex, newIndex);
    await this.persistOrder();
  }

  private swapNotesRealtime(fromIndex: number, toIndex: number) {
    const updated = [...this.notes];
    const [movedNote] = updated.splice(fromIndex, 1);
    if (!movedNote) return;

    updated.splice(toIndex, 0, movedNote);
    this.notes = updated.map((note, idx) => ({ ...note, order: idx + 1 }));
  }

  private async persistOrder() {
    await Promise.all(
      this.notes.map((note) =>
        fetch(`/api/notes/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: note.order }),
        })
      )
    );
  }

  // --- Real-time Pointer Event Drag Handlers ---
  private handleNoteDragStart(e: CustomEvent, index: number) {
    const pointerEvent = e.detail.pointerEvent as PointerEvent;
    const cardWrapper = (e.target as HTMLElement).closest('.card-wrapper') as HTMLElement;

    if (!cardWrapper) return;

    this.activeDragIndex = index;
    this.activePointerId = pointerEvent.pointerId;

    try {
      cardWrapper.setPointerCapture(pointerEvent.pointerId);
    } catch (_) {}
  }

  private handlePointerMove(e: PointerEvent) {
    if (this.activeDragIndex === null) return;

    const elements = this.shadowRoot?.elementsFromPoint(e.clientX, e.clientY) || [];
    const targetWrapper = elements.find((el) =>
      el.classList.contains('card-wrapper')
    ) as HTMLElement | undefined;

    if (targetWrapper && targetWrapper.dataset.index !== undefined) {
      const hoverIndex = parseInt(targetWrapper.dataset.index, 10);
      if (!isNaN(hoverIndex) && hoverIndex !== this.activeDragIndex) {
        this.swapNotesRealtime(this.activeDragIndex, hoverIndex);
        this.activeDragIndex = hoverIndex;
      }
    }
  }

  private async handlePointerUp(e: PointerEvent) {
    if (this.activeDragIndex === null) return;

    const targetWrapper = (e.currentTarget as HTMLElement);
    if (targetWrapper && this.activePointerId !== null) {
      try {
        targetWrapper.releasePointerCapture(this.activePointerId);
      } catch (_) {}
    }

    this.activeDragIndex = null;
    this.activePointerId = null;

    await this.persistOrder();
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
        if (this.activeDragIndex === null) {
          this.notes = fetchedNotes;
        }
        this.contextValue = { ...this.contextValue, notes: this.notes, loading: false };

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
                      class="card-wrapper ${this.activeDragIndex === index ? 'dragging' : ''}"
                      data-index="${index}"
                      @pointermove=${this.handlePointerMove}
                      @pointerup=${this.handlePointerUp}
                      @pointercancel=${this.handlePointerUp}
                    >
                      <note-card
                        .note=${note}
                        @note-drag-start=${(e: CustomEvent) => this.handleNoteDragStart(e, index)}
                      ></note-card>
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