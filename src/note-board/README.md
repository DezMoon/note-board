# `src/note-board/`

This directory is where the challenge work happens. It is intentionally empty apart from this file —
implement your components here (e.g. `note-board.ts`, `note-card.ts`, `types.ts`, a context store, …).

## Type contract (given — do not change)

```ts
export interface Note {
  id: string;
  title: string;
  bodyHtml: string;        // sanitized TipTap output
  order: number;
  updatedAt: string;       // ISO date
}

export interface NotesApi {
  list(): Promise<Note[]>;
  create(input: Pick<Note, 'title' | 'bodyHtml'>): Promise<Note>;
  update(id: string, patch: Partial<Pick<Note, 'title' | 'bodyHtml' | 'order'>>): Promise<Note>;
  remove(id: string): Promise<void>;
}
```

The contract may only be extended additively (extra optional fields, extra types). Do not remove or rename
the given shape.
