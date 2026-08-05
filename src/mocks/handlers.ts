import { delay, http, HttpResponse } from 'msw'

export interface MockNote {
  id: string
  title: string
  bodyHtml: string
  order: number
  updatedAt: string
}

const seedNotes: MockNote[] = [
  {
    id: 'n-1',
    title: 'Welcome to the Note Board',
    bodyHtml:
      '<p>This is a sample note. Your <code>&lt;note-board&gt;</code> component will load, create, edit, reorder and delete notes like this one against the mocked API.</p>',
    order: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'n-2',
    title: 'Drag me',
    bodyHtml: '<p>Reorder notes by dragging. Persist the new order through the API.</p>',
    order: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'n-3',
    title: 'Edit me',
    bodyHtml:
      '<p>Switch a note into edit mode to edit with TipTap. Output is sanitized with DOMPurify before it is saved and rendered.</p>',
    order: 3,
    updatedAt: new Date().toISOString(),
  },
]

const notes: MockNote[] = [...seedNotes]

let noteSequence = 1

const ERROR_RATE = 0.15
const MIN_LATENCY_MS = 250
const MAX_LATENCY_MS = 600

function latency(): number {
  return MIN_LATENCY_MS + Math.round(Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS))
}

function maybeError(): ReturnType<typeof HttpResponse.json> | null {
  if (Math.random() < ERROR_RATE) {
    return HttpResponse.json({ message: 'Simulated server error' }, { status: 500 })
  }
  return null
}

export const handlers = [
  http.get('/api/notes', async () => {
    await delay(latency())
    const error = maybeError()
    if (error) return error
    return HttpResponse.json([...notes].sort((a, b) => a.order - b.order))
  }),

  http.post('/api/notes', async ({ request }) => {
    await delay(latency())
    const error = maybeError()
    if (error) return error
    const body = (await request.json()) as { title?: string; bodyHtml?: string }
    const note: MockNote = {
      id: `n-${Date.now()}-${noteSequence++}`,
      title: body.title ?? 'Untitled note',
      bodyHtml: body.bodyHtml ?? '<p></p>',
      order: notes.length === 0 ? 1 : Math.max(...notes.map((n) => n.order)) + 1,
      updatedAt: new Date().toISOString(),
    }
    notes.push(note)
    return HttpResponse.json(note, { status: 201 })
  }),

  http.patch('/api/notes/:id', async ({ params, request }) => {
    await delay(latency())
    const error = maybeError()
    if (error) return error
    const id = String(params.id)
    const index = notes.findIndex((n) => n.id === id)
    const current = notes[index]
    if (current === undefined) {
      return HttpResponse.json({ message: 'Note not found' }, { status: 404 })
    }
    const patch = (await request.json()) as {
      title?: string
      bodyHtml?: string
      order?: number
    }
    const updated: MockNote = {
      ...current,
      ...(typeof patch.title === 'string' ? { title: patch.title } : {}),
      ...(typeof patch.bodyHtml === 'string' ? { bodyHtml: patch.bodyHtml } : {}),
      ...(typeof patch.order === 'number' ? { order: patch.order } : {}),
      updatedAt: new Date().toISOString(),
    }
    notes[index] = updated
    return HttpResponse.json(updated)
  }),

  http.delete('/api/notes/:id', async ({ params }) => {
    await delay(latency())
    const error = maybeError()
    if (error) return error
    const id = String(params.id)
    const index = notes.findIndex((n) => n.id === id)
    if (index === -1) {
      return HttpResponse.json({ message: 'Note not found' }, { status: 404 })
    }
    notes.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
