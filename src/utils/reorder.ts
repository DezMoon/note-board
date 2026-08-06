import type { Note } from '../types';

export function reorderNotesList(notes: readonly Note[], fromIndex: number, toIndex: number): Note[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= notes.length ||
    toIndex >= notes.length
  ) {
    return [...notes];
  }

  const result = [...notes];
  const movedItem = result[fromIndex];

  if (!movedItem) {
    return [...notes];
  }

  result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedItem);

  return result.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
}