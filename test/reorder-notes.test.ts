import { describe, expect, it } from 'vitest'
import { reorderNotes } from '../src/note-board/reorder-notes'
import type { Note } from '../src/note-board/types'

const notes: Note[] = [
    {
        id: 'two',
        title: 'Number Two',
        bodyHtml: '<p>This is a test</p>',
        order: 2,
        updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
        id: 'one',
        title: 'Number One',
        bodyHtml: '<p>This is a test</p>',
        order: 1,
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 'three',
        title: 'Number Three',
        bodyHtml: '<p>This is a test</p>',
        order: 3,
        updatedAt: '2026-01-03T00:00:00.000Z',
    },
]

describe('reorderNotes', () => {
    it('move a note and assign sequential order value', () => {
        const result = reorderNotes(notes,0,2)

        expect(result.map((note) => note.order)).toEqual([
            1,
            2,
            3,
        ])
    })
    it('does not mutate the original notes', () => {
        reorderNotes(notes,0,2)

        expect(notes.map((note) => note.order)).toEqual([
            2,
            1,
            3,
        ])
    })
})
