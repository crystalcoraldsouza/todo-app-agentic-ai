export interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDateTime: string | null;
  ordinal: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoInput {
  title: string;
  description: string | null;
  dueDateTime: string | null;
}

export type TodoUpdate = Partial<TodoInput> & { isCompleted?: boolean };

export class TodoApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'TodoApiError';
  }
}

const NETWORK_ERROR = 'Could not connect to the server. Check that the backend is running and try again.';
const INVALID_RESPONSE_ERROR = 'The server returned an unexpected response. Please try again.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTodo(value: unknown): value is Todo {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    (typeof value.description === 'string' || value.description === null) &&
    (typeof value.dueDateTime === 'string' || value.dueDateTime === null) &&
    typeof value.ordinal === 'number' &&
    typeof value.isCompleted === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string';
}

async function getApiError(response: Response): Promise<TodoApiError> {
  try {
    const body: unknown = await response.json();

    if (isRecord(body) && isRecord(body.error)) {
      const message = typeof body.error.message === 'string'
        ? body.error.message
        : `The request could not be completed (HTTP ${response.status}).`;
      const code = typeof body.error.code === 'string' ? body.error.code : 'HTTP_ERROR';

      return new TodoApiError(message, response.status, code);
    }
  } catch {
    // Use a generic message when the server response is not JSON.
  }

  return new TodoApiError(
    `The request could not be completed (HTTP ${response.status}).`,
    response.status,
    'HTTP_ERROR',
  );
}

async function sendRequest(path: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(NETWORK_ERROR);
    }

    throw error;
  }
}

async function readTodo(response: Response): Promise<Todo> {
  if (!response.ok) {
    throw await getApiError(response);
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(INVALID_RESPONSE_ERROR);
  }

  if (!isTodo(body)) {
    throw new Error(INVALID_RESPONSE_ERROR);
  }

  return body;
}

export async function getTodos(signal?: AbortSignal): Promise<Todo[]> {
  const response = await sendRequest('/api/todos', { signal });

  if (!response.ok) {
    throw await getApiError(response);
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(INVALID_RESPONSE_ERROR);
  }

  if (!Array.isArray(body) || !body.every(isTodo)) {
    throw new Error(INVALID_RESPONSE_ERROR);
  }

  return body;
}

export async function createTodo(input: TodoInput): Promise<Todo> {
  const response = await sendRequest('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return readTodo(response);
}

export async function updateTodo(id: string, input: TodoUpdate): Promise<Todo> {
  const response = await sendRequest(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return readTodo(response);
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await sendRequest(`/api/todos/${id}`, { method: 'DELETE' });

  if (!response.ok) {
    throw await getApiError(response);
  }
}
