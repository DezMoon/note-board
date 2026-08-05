import { describe, expect, it} from 'vitest'
import { sanitizeNoteHtml } from '../src/note-board/sanitize-html'

describe('sanitizeNoteHtml', () => {
    it('keep normal rich text HTML', () => {
        const html = '<p>Hello <strong>Andrew</strong></p>'

        expect(sanitizeNoteHtml(html)).toBe(
            '<p>Hello <strong>Andrew</strong></p>'
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

    it('Remove dangerous event attributes', () => {
        const html = `
        <img
        src="missing.jpg"
        onerror="alert('Unsafe')"
        >
        `

        const result = sanitizeNoteHtml(html)
        expect(result).toContain('src="missing.jpg"')
        expect(result).not.toContain('onerror')
        expect(result).not.toContain("alert('Unsafe')")
    })
})
