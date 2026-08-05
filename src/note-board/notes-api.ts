import type { Note, NotesApi, NoteUpdate } from './types'

interface ApiErrorBody {
    message?: string
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
    return typeof value === 'object' && value !== null && 'message' in value
}

async function getErrorMessage(response: Response): Promise<string>{
    try {
        const body: unknown = await response.json()

        if (isApiErrorBody(body) && typeof body.message === 'string') {
            return body.message
        }
    } catch {

    }

    return response.statusText || `Request failed with Status ${response.status}`
}

async function ensureSuccess(response: Response): Promise<Response> {
    if (!response.ok) {
        throw new Error(await getErrorMessage(response))
    }

    return response
}

async function readJson<T>(response: Response): Promise<T> {
    await ensureSuccess(response)

    return (await response.json()) as T
}

export class HttpNotesApi implements NotesApi {
    constructor(private readonly baseUrl = '/api/notes') {}

    async list(): Promise<Note[]> {
        const response = await fetch(this.baseUrl)

        return readJson<Note[]>(response)
    }

    async create(
        input: Pick<Note, 'title' | 'bodyHtml'>
    ): Promise<Note> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-type' : 'application/json'
            },
            body: JSON.stringify(input),
        })
        return readJson<Note>(response)
    }

    async update(
        id: string,
        patch: NoteUpdate,
    ): Promise<Note> {
        const response = await fetch(
            `${this.baseUrl}/${encodeURIComponent(id)}`,
            {
            method: 'PATCH',
            headers: {
                'Content-type' : 'application/json'
            },
            body: JSON.stringify(patch),
        },
    )
        return readJson<Note>(response)
    }

    async remove(
        id: string,
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/${encodeURIComponent(id)}`,
            {
            method: 'DELETE',
        },
    )
        await ensureSuccess(response)
    }
}

export const notesApi: NotesApi = new HttpNotesApi()