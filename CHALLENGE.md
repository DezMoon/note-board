# Frontend Engineer Take-Home Challenge — "Note Board"

## 1. Context

This challenge mirrors our real frontend stack — the one used for our no-code platform: **Lit web
components + strict TypeScript**, no framework, with `@lit/context`/`@lit/task` for state, TipTap for rich
text, and Vitest + Cypress for testing. It's designed to take a competent mid/senior candidate **3–5
focused hours**. It is not meant to be "completed perfectly" — partial, well-reasoned work beats a rushed
full solution.

You have **7 days** from receiving repo access to open a PR. If you need more time, just ask.

---

## 2. What you'll build

A `<note-board>` component: a small board of rich-text notes that can be created, edited, reordered by
drag-and-drop, and are loaded/saved against a mocked API.

Think "mini Trello card list with a rich text editor inside each card," built the way we'd actually build
it.

---

## 3. What's already in the repo

The repo is pre-scaffolded so you spend your time on the actual problem, not boilerplate:

- Vite 7 project, TypeScript 6, `strict` tsconfig (below)
- Lit 3, `@lit/context`, `@lit/task`, `@open-wc/lit-helpers` installed
- TipTap 3 (`starter-kit`, `placeholder`, `link`) installed but **not wired up**
- `sortablejs` (+ `@types/sortablejs`) installed but not wired up
- `dompurify` installed
- MSW configured with a `/api/notes` mock endpoint (GET/POST/PATCH/DELETE) returning realistic latency +
  occasional error, already registered in `vitest` and a `mocks/browser.ts` for dev
- Vitest 4 + Cypress 15 (component testing, Chrome only is fine for this exercise) pre-configured with one
  intentionally trivial passing test each, so you can see the pattern
- An empty `src/note-board/` directory with a `README.md` stub containing the type contract below
- `npm run dev`, `npm run build`, `npm run test`, `npm run test:e2e`, `npm run storybook` all working out
  of the box

### Required `tsconfig.json` compiler options

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "useDefineForClassFields": false, // required for Lit decorators
    "experimentalDecorators": true
  }
}
```

Any `any`, `@ts-ignore`, or `as unknown as X` cast in submitted code must be justified in a code comment —
reviewers treat unexplained ones as a red flag.

### Type contract (given, do not change)

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

---

## 4. Functional requirements (must-have)

1. **`<note-board>`** fetches notes on connect via `NotesApi.list()`, driven by `@lit/task`, and renders:
   - a loading state
   - an error state with a retry action
   - the list of notes sorted by `order`
2. **`<note-card>`** (child component) renders a note's title and rendered `bodyHtml`, and can be switched
   into an edit mode.
3. **Rich text editing**: in edit mode, the note body is edited with a TipTap editor
   (`starter-kit` + `placeholder` + `link` is enough). On save, the resulting HTML is sanitized with
   DOMPurify before being persisted and rendered.
4. **Create / delete**: user can add a new note and delete an existing one; both round-trip through
   `NotesApi`.
5. **Drag-and-drop reorder**: notes can be reordered via `sortablejs`; the new order is persisted (batched
   or per-item, your call — state the tradeoff in the PR description).
6. **Shared state via `@lit/context`**: the notes list / selected note / mutation methods should be
   provided via a Lit context at the `<note-board>` level and consumed by children — not passed down as a
   long prop chain, and not global mutable state outside Lit's reactivity.
7. **No `any`. No unhandled promise rejections.** Network/mock errors must surface in the UI, not just the
   console.

## 5. Non-functional / quality requirements

- Components are real custom elements with proper `static styles`, scoped via shadow DOM — no reaching into
  another component's internals.
- Public component APIs (`@property`/`@state`) are typed, not `any`/`unknown`.
- No layout-breaking on empty state (0 notes) or a note with a very long title/body.
- Reasonable a11y basics: buttons are `<button>`, form inputs have labels, focus isn't lost when a note is
  added/removed.

## 6. Testing requirements

- **Vitest**: unit test at least one pure/isolable piece of logic (e.g., the sanitizer wrapper, the
  reorder/index math, or the context store's update logic). Mocking the DOM is not the point here — test
  logic, not markup.
- **Cypress component test**: at least one test that mounts `<note-board>` (with MSW mocking the API — see
  `cy.startMsw()` in `cypress/support/component.ts`) and exercises a real user flow — e.g., add a note,
  edit its text, confirm it renders sanitized HTML.
- Tests must be deterministic — no arbitrary `setTimeout` waits; use the async utilities the stack already
  provides (`@lit/task` state, Cypress retry-ability, MSW).

## 7. Bonus challenges (optional — pick any, none required)

Ordered roughly by effort. These are genuinely optional and meant to differentiate strong frontend
candidates; there's no penalty for skipping them, but thoughtful bonus work is a strong positive signal.

- **Storybook story** for `<note-card>` with controls/args covering empty/long/error states
- **Keyboard-accessible reorder**: an up/down-arrow or keyboard alternative to drag-and-drop
- **Optimistic UI**: reorder/edit updates the UI immediately and rolls back on API failure
- **Debounced autosave** with a visible "Saving… / Saved" indicator
- **Undo/delete**: deleting a note shows an "Undo" toast for N seconds before the API call actually fires
- **Dark mode** via CSS custom properties + `prefers-color-scheme`, no styling duplication
- **Export to Excel** of note titles/timestamps using `exceljs`
- **Cypress E2E-style test** (full app boot, not component mount)
- **Bundle awareness**: lazy-load the TipTap editor chunk so it's not in the initial bundle for read-only
  note views (measure with `vite-bundle-analyzer` and note the before/after in the PR)

---

## 8. Submission instructions

1. Open a **draft PR immediately** — this lets you push incrementally, which is preferred over one giant
   commit at the end.
2. Commit incrementally with meaningful messages. Your git history is read, not just the final diff — it
   shows how you work.
3. In the PR description, include:
   - What you built vs. skipped, and why
   - Any tradeoffs you made under time pressure
   - Which bonus item(s), if any, you attempted
   - How to run it locally (should already work with the scaffold's scripts, but confirm)
4. Mark the PR "Ready for review" when done.

## 9. AI usage policy

**No AI coding assistants, code-generation tools, or LLMs (Copilot, ChatGPT, Claude, Cursor, etc.) for any
part of this challenge** — not for the implementation, not for the tests, not for the PR description. This
is a hard requirement, not a soft preference.

We evaluate for this in two ways:

- **Git history**: real incremental work has a signature — false starts, small fixes, non-uniform commit
  sizes/timing. Wholesale single-commit drops of finished, idiomatic code are treated as a strong red flag.
- **Follow-up conversation**: if you're moved to the next round, expect to walk through your code live and
  make a small live change to it. Candidates who can't explain or extend their own submission will not
  proceed regardless of how good the diff looked.

If you use AI tools for anything unrelated (e.g., looking up a Lit API in normal day-to-day work), that's
fine in general — just not for this exercise. Be honest; honest, slightly rough work is far preferred to
something that can't be trusted.

---

## 10. Evaluation rubric

| Area | Weight | What we're looking for |
|---|---|---|
| Correctness of core flow (load/create/edit/delete/reorder) | 25% | Works, handles the error/empty/loading states, no console errors |
| TypeScript strictness | 15% | No unjustified `any`/casts, types actually model the domain, contract types respected |
| Component design & Lit idioms | 15% | Proper reactive properties vs. internal state, shadow DOM boundaries, context used correctly (not prop-drilled, not global mutable state) |
| State management correctness | 10% | `@lit/task` used for the async lifecycle correctly; mutations don't cause stale/duplicate renders |
| Testing | 15% | Tests are meaningful (not tautological), deterministic, cover a real user flow |
| Code quality & readability | 10% | Would we want to maintain this in six months |
| Git hygiene / PR communication | 10% | Commit history tells a story; PR description explains tradeoffs |
| Bonus work | up to +10% | Genuinely adds signal, doesn't come at the cost of the core requirements |

A candidate who nails the core requirements cleanly, with two solid tests and a clear PR description, scores
well — bonus items are a tiebreaker, not a requirement.

---

## 11. FAQ

- **Can I restructure the given type contract?** Only additively (extra optional fields, extra types).
  Don't remove/rename the given shape — it's there so we can compare submissions consistently.
- **Can I add extra libraries?** Small, justified additions are fine (e.g., a tiny date formatter) —
  explain why in the PR. Don't add a state management framework or another component framework; the point
  is to see how you use Lit/`@lit/context` directly.
- **Do I need every TipTap extension from the real stack?** No — `starter-kit` + `placeholder` + `link` is
  sufficient for this exercise.
- **What if I run out of time?** Push what you have, note what's missing/rough in the PR description, and
  stop. Honest incomplete work is preferred to something padded out or rushed into a broken state.
