import type { Note } from './types'

export function sortNotesByOrder(notes: readonly Note[]): Note[] {
    return [...notes].sort(
        (first, second) => first.order - second.order,
    )
}

export function reorderNotes(
    notes: readonly Note[],
    oldIndex: number,
    newIndex: number,
): Note[] {
    const orderedNotes = sortNotesByOrder(notes)

    if (
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= orderedNotes.length ||
        newIndex >= orderedNotes.length ||
        oldIndex === newIndex
    ) {
        return orderedNotes
    }

    const movedNotes = [...orderedNotes]

    const [movedNote] = movedNotes.splice(oldIndex, 1)
    if (movedNote === undefined) {
        return orderedNotes
    }

    movedNotes.splice(newIndex,0,movedNote)

    return movedNotes.map((note, index) => ({
        ...note,
        order: index + 1,
    }))
}