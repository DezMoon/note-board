import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { css, html, LitElement } from 'lit'
import {
  customElement,
  property,
  query,
} from 'lit/decorators.js'

@customElement('note-editor')
export class NoteEditor extends LitElement {
  static override styles = css`
    .toolbar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .editor {
      min-height: 100px;
      border: 1px solid #ccc;
      padding: 0.5rem;
    }
  `

  @property()
  value = ''

  @query('.editor')
  private editorElement!: HTMLDivElement

  private editor?: Editor

  protected override firstUpdated(): void {
    this.editor = new Editor({
      element: this.editorElement,
      extensions: [StarterKit],
      content: this.value,
    })
  }

  override disconnectedCallback(): void {
    this.editor?.destroy()
    super.disconnectedCallback()
  }

  getHtml(): string {
    return this.editor?.getHTML() ?? this.value
  }

  override render() {
    return html`
      <div class="toolbar">
        <button
          type="button"
          @click=${() =>
            this.editor
              ?.chain()
              .focus()
              .toggleBold()
              .run()}
        >
          Bold
        </button>

        <button
          type="button"
          @click=${() =>
            this.editor
              ?.chain()
              .focus()
              .toggleItalic()
              .run()}
        >
          Italic
        </button>

        <button
          type="button"
          @click=${() =>
            this.editor
              ?.chain()
              .focus()
              .toggleBulletList()
              .run()}
        >
          List
        </button>
      </div>

      <div
        class="editor"
        aria-label="Note body"
      ></div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-editor': NoteEditor
  }
}