import DOMPurify from 'dompurify'

export function sanitizeNoteHtml(html: string): string {
    return DOMPurify.sanitize(html)
}