import { css, html, LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import Sortable from 'sortablejs'

import { notesApi } from './api'
import type { Note } from './types'
import type { NoteBoardContextValue } from './context'

// Minimal local TaskController shim to avoid adding an external dependency
class TaskController<T = unknown> {
  private host: any
  private taskFn: () => Promise<T>

  constructor(host: any, options: { task: () => Promise<T>; autoRun?: boolean }) {
    this.host = host
    this.taskFn = options.task
    if (options.autoRun) {
      // fire and forget
      this.run().catch(() => {})
    }
  }

  async run(): Promise<T> {
    return this.taskFn()
  }

  render(handlers: { pending: () => unknown; complete: () => unknown; error: (err: any) => unknown }) {
    if (this.host.isLoading) return handlers.pending()
    if (this.host.error) return handlers.error({ error: this.host.error })
    return handlers.complete()
  }
}

@customElement('note-board')
export class NoteBoard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
      color: #111;
    }

    .board {
      border: 1px solid #d1d5db;
      border-radius: 16px;
      background: #fff;
      padding: 1rem;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    button {
      border: 1px solid #374151;
      background: #111827;
      color: #fff;
      border-radius: 999px;
      padding: 0.6rem 1rem;
      cursor: pointer;
    }

    .state {
      padding: 1.5rem;
      border: 1px dashed #d1d5db;
      border-radius: 16px;
      text-align: center;
      color: #4b5563;
    }

    .note-list {
      display: grid;
      gap: 1rem;
    }
  `

  @state() private notes: Note[] = []
  @state() private selectedNoteId: string | undefined = undefined
  @state() private error: string | null = null
  @state() private isLoading = false

  private sortable: Sortable | undefined = undefined
  private provider: { setValue: (v: NoteBoardContextValue) => void } = {
    setValue: () => {},
  }

  private readonly loadTask = new TaskController(this, {
    task: async () => {
      this.error = null
      this.isLoading = true

      try {
        const notes = await notesApi.list()
        this.notes = notes.sort((a, b) => a.order - b.order)
        return this.notes
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    autoRun: true,
  })

  protected override updated(): void {
    this.provider.setValue(this.createContextValue())
    this.installSortable()
  }

  private createContextValue(): NoteBoardContextValue {
    return {
      notes: this.notes,
      selectedNoteId: this.selectedNoteId,
      isLoading: this.isLoading,
      error: this.error,
      loadNotes: () => this.loadTask.run(),
      createNote: async (input) => {
        const created = await notesApi.create(input)
        this.notes = [...this.notes, created].sort((a, b) => a.order - b.order)
        this.selectedNoteId = created.id
        return created
      },
      updateNote: async (id, patch) => {
        const updated = await notesApi.update(id, patch)
        this.notes = this.notes
          .map((note) => (note.id === id ? updated : note))
          .sort((a, b) => a.order - b.order)
        return updated
      },
      deleteNote: async (id) => {
        await notesApi.remove(id)
        this.notes = this.notes.filter((note) => note.id !== id)
        if (this.selectedNoteId === id) {
          this.selectedNoteId = undefined
        }
      },
      reorderNotes: async (sourceIndex, targetIndex) => {
        if (
          sourceIndex < 0 ||
          targetIndex < 0 ||
          sourceIndex === targetIndex ||
          sourceIndex >= this.notes.length ||
          targetIndex >= this.notes.length
        ) {
          return
        }

        const reordered = [...this.notes]
        const moved = reordered.splice(sourceIndex, 1)[0]!
        reordered.splice(targetIndex, 0, moved)
        this.notes = reordered.map((note, index) => ({ ...note, order: index + 1 }))

        await Promise.all(
          this.notes.map((note) =>
            notesApi.update(note.id, { order: note.order }),
          ),
        )
      },
      selectNote: (id) => {
        this.selectedNoteId = id
      },
    }
  }

  private installSortable(): void {
    const container = this.renderRoot.querySelector('.note-list')
    if (!container) {
      this.sortable?.destroy()
      this.sortable = undefined
      return
    }

    if (this.sortable) {
      this.sortable.destroy()
    }

    this.sortable = new Sortable(container as HTMLElement, {
      animation: 200,
      handle: '.note-handle',
      onEnd: (event) => {
        if (event.oldIndex == null || event.newIndex == null) {
          return
        }
        this.createContextValue().reorderNotes(event.oldIndex, event.newIndex)
      },
    })
  }

  private renderLoading() {
    return html`<div class="state">Loading notes…</div>`
  }

  private renderError(error: Error) {
    return html`
      <div class="state">
        <p>${error.message}</p>
        <button @click=${() => this.loadTask.run()}>Retry</button>
      </div>
    `
  }

  private renderEmpty() {
    return html`
      <div class="state">
        <p>No notes yet.</p>
        <button @click=${() => this.handleAddNote()}>Create first note</button>
      </div>
    `
  }

  private handleAddNote() {
    this.createContextValue().createNote({
      title: 'New note',
      bodyHtml: '<p></p>',
    })
  }

  protected override render() {
    return this.loadTask.render({
      pending: () => this.renderLoading(),
      complete: () => this.renderBoard(),
      error: (result: any) => this.renderError(result.error),
    })
  }

  private renderBoard() {
    return html`
      <div class="board">
        <div class="toolbar">
          <h2>Note Board</h2>
          <button @click=${() => this.handleAddNote()}>Add note</button>
        </div>

        ${this.notes.length === 0
          ? this.renderEmpty()
          : html`
              <div class="note-list">
                ${this.notes.map(
                  (note) => html`
                    <note-card
                      .note=${note}
                      .selected=${note.id === this.selectedNoteId}
                    ></note-card>
                  `,
                )}
              </div>
            `}
      </div>
    `
  }
}