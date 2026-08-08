import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from './sanitizer'

describe('sanitizeHtml', () => {
  it('removes script tags and dangerous attributes', () => {
    const dirty = `<p>Hello</p><script>alert(1)</script><img src=x onerror=alert(2)>`;
    const clean = sanitizeHtml(dirty)

    expect(clean).toContain('Hello')
    expect(clean).not.toContain('<script>')
    expect(clean).not.toContain('onerror')
  })
})
