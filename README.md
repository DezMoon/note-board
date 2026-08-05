# Note Board — Frontend Take-Home Challenge

Build `<note-board>`: a small board of rich-text notes that can be created, edited, reordered by
drag-and-drop, and are loaded/saved against a mocked API. Think "mini Trello card list with a rich text
editor inside each card," built the way we'd actually build it.

**Lit web components + strict TypeScript**, no framework,
with `@lit/context` for shared state and MSW for API mocking. You choose the libraries you use for each
piece of functionality and explain your choices in the PR. It is not meant to be "completed perfectly" —
partial, well-reasoned work beats a rushed full solution.

**Log the time you spend** (per feature or per session) and include the record in your PR description.

**Read [`CHALLENGE.md`](./CHALLENGE.md) for the full brief.** Everything below is how to use this scaffold.

---

## Quickstart

Requires Node >= 22.12 and npm.

```sh
npm install        # install dependencies
npm run dev        # Vite dev server → http://localhost:5173 (MSW is live in dev)
npm run test       # Vitest unit tests
npm run test:e2e   # Cypress component tests (headless)
npm run test:e2e:open  # Cypress component tests (interactive)
npm run storybook # Storybook → http://localhost:6006
npm run build     # strict typecheck + production build → dist/
```

All of these work out of the box on the scaffold.

---

## Where the work happens

Everything you implement goes in **`src/note-board/`** (currently empty apart from a README stub). Good
starting points for the structure: `note-board.ts`, `note-card.ts`, a context store, and `types.ts` (the
type contract lives in [`src/note-board/README.md`](./src/note-board/README.md) — do not change it).

## Required stack

- **Lit 3** web components, shadow DOM + scoped `static styles` (no framework)
- **TypeScript 6, strict** — see `tsconfig.json`; no `any`, no `@ts-ignore`, no unexplained casts
- **`@lit/context`** for shared state
- **MSW** for API mocking (handlers live in `src/mocks/`; registered in Vitest via `test/setup.ts` and in
  dev via `src/main.ts`)

## Your choices

The following are pre-installed for you, but using them is **your call** — pick what you need for each
functionality and justify your choices in the PR:

- **Rich text editing**: TipTap 3 (`starter-kit`, `placeholder`, `link`) is installed, or use another editor
- **Drag-and-drop reorder**: `sortablejs` (+ types) is installed, or use another approach
- **HTML sanitization**: `dompurify` is installed, or sanitize another way
- Also available if useful: `@lit/task`, `@open-wc/lit-helpers`

## Testing conventions

- **Vitest** — test pure/isolable logic (sanitizer wrapper, reorder math, context store updates). No DOM
  mocking required; `happy-dom` is configured. See `test/example.test.ts` for the pattern.
- **Cypress component tests** — `cy.mount()` from `cypress-lit` (see `cypress/component/smoke.cy.ts`).
  Two ways to mock the API in a CT test:
  - **`cy.startMsw()`** — starts the MSW service worker before you mount, so the shared handlers intercept
    API requests. This is the "MSW mocking the API" flow from the brief.
  - **`cy.intercept()`** — the pattern used for component tests in our production codebase; useful for
    per-test overrides.
- Tests must be deterministic — no arbitrary `setTimeout` waits; use async task state, Cypress
  retry-ability, and MSW.

## Storybook

Stories live in `src/**/*.story.ts` (see `src/example.story.ts` — replace it). `addon-a11y` and
`addon-docs` are configured.

## Project layout

```
src/
  mocks/            MSW handlers + browser/node workers
  note-board/       your implementation goes here (type contract in README.md)
  main.ts           dev entry — starts the MSW worker in dev, then renders
  example.story.ts  placeholder Storybook story (replace)
test/
  setup.ts          Vitest MSW server registration
  example.test.ts   placeholder unit test (replace)
cypress/
  component/        component specs
  support/          cy.mount (cypress-lit) + cy.startMsw commands
```

---

## FAQ

- **Can I restructure the given type contract?** Only additively (extra optional fields, extra types).
  Don't remove/rename the given shape — it's there so submissions can be compared consistently.
- **Must I use TipTap, sortablejs, or dompurify?** No — they're pre-installed options. Pick what you need
  for each feature and justify your choices in the PR.
- **Can I add extra libraries?** Small, justified additions are fine (e.g., a tiny date formatter) —
  explain why in the PR. Don't add a state management framework or another component framework; the point
  is to see how you use Lit/`@lit/context` directly.
- **What if I run out of time?** Push what you have, note what's missing/rough in the PR description, and
  stop. Honest incomplete work beats something padded out or rushed into a broken state.
