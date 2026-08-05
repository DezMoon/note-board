import { describe, expect, it} from 'vitest'
import { sanitizeNoteHtml } from '../src/note-board/sanitize-html'

describe('sanitizeNoteHtml', () => {
    it('keep normal rich text HTML', () => {
        const html = '<p>Hello <strong>Andrew</strong></p>'

        expect(sanitizeNoteHtml(html)).toBe(
            'Hello <strong>Andrew</strong>'
        )
    })

    it('remove script elements', () => {
        const html = `
        <p>Safe Content</p>
        <script>alert('Unsafe')</scripts>
        `

        const result = sanitizeNoteHtml(html)
        expect(result).toContain('<p>Safe Content</p>')
        expect(result).not.toContain('<script')
        expect(result).not.toContain("alert('Unsafe')")
    })
})
