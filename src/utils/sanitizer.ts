import DOMPurify from 'dompurify';

export function sanitizeHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}