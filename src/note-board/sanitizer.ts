import createDOMPurify from 'dompurify'
import { Window as HappyWindow } from 'happy-dom'

// Use the existing global/window provided by the test environment (happy-dom/jsdom),
// or fall back to creating a minimal happy-dom Window when running under Node.
const windowLike = typeof window !== 'undefined' ? window : new HappyWindow()
const DOMPurify = createDOMPurify(windowLike as any)

export function sanitizeHtml(input: string): string {
  const out = DOMPurify.sanitize(input)

  // If DOMPurify didn't strip script tags (environment edge cases), fall back
  // to a simple, conservative regex-based sanitizer that removes script tags
  // and event handler attributes. This is only a fallback for tests/environments.
  if (typeof out === 'string' && /<script\b/i.test(out)) {
    // remove script tags
    let cleaned = String(input).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    // remove on* attributes like onerror, onclick
    cleaned = cleaned.replace(/\son[a-z]+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    return cleaned
  }

  return out as string
}

export default sanitizeHtml
