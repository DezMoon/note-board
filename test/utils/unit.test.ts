import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../src/utils/sanitizer';
import { reorderNotesList } from '../../src/utils/reorder';
import type { Note } from '../../src/types';

describe('Pure Logic Unit Tests', () => {
  describe('sanitizeHtml', () => {
    it('removes malicious script tags while retaining safe formatting', () => {
      const rawInput = '<p>Hello <b>World</b><script>alert("xss")</script></p>';
      const clean = sanitizeHtml(rawInput);
      expect(clean).toBe('<p>Hello <b>World</b></p>');
    });
  });

  describe('reorderNotesList', () => {
    const mockNotes: Note[] = [
      { id: '1', title: 'Note 1', bodyHtml: '<p>1</p>', order: 1, updatedAt: '2026-01-01' },
      { id: '2', title: 'Note 2', bodyHtml: '<p>2</p>', order: 2, updatedAt: '2026-01-01' },
      { id: '3', title: 'Note 3', bodyHtml: '<p>3</p>', order: 3, updatedAt: '2026-01-01' },
    ];

    it('correctly reorders items and updates 1-based index orders', () => {
      const result = reorderNotesList(mockNotes, 0, 2);
      expect(result.map((n: Note) => n.id)).toEqual(['2', '3', '1']);
      expect(result.map((n: Note) => n.order)).toEqual([1, 2, 3]);
    });

    it('returns unmodified copy on out of bounds indexes', () => {
      const result = reorderNotesList(mockNotes, -1, 10);
      expect(result).toEqual(mockNotes);
    });
  });
});