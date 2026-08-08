import type { Note, NotesApi } from './types'

const API_BASE = '/api/notes'

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ message: response.statusText }))
    const message = typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message: unknown }).message)
      : response.statusText

    throw new Error(message || 'Network error')
  }

  return response.status === 204
    ? (undefined as unknown as T)
    : response.json()
}

export const notesApi: NotesApi = {
  list: () => fetchJson<Note[]>(API_BASE),
  create: (input) =>
    fetchJson<Note>(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  update: (id, patch) =>
    fetchJson<Note>(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  remove: (id) =>
    fetchJson<void>(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
}