import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.js';
import type { Todo } from './todoService.js';

const firstTodo: Todo = {
  id: 'todo-1',
  title: 'Buy groceries',
  description: 'Milk and bread',
  dueDateTime: null,
  ordinal: 0,
  isCompleted: false,
  createdAt: '2026-11-09T09:00:00.000Z',
  updatedAt: '2026-11-09T09:00:00.000Z',
};

const completedTodo: Todo = {
  ...firstTodo,
  id: 'todo-2',
  title: 'Water plants',
  ordinal: 1,
  isCompleted: true,
};

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ToDo application', () => {
  it('shows active ToDos by default and lets the user show completed ToDos', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([firstTodo, completedTodo]));
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Buy groceries' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Water plants' })).toBeNull();
    expect(screen.getByText('1 item')).toBeTruthy();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Show completed (1)' }));

    expect(screen.getByRole('heading', { name: 'Water plants' })).toBeTruthy();
    expect(screen.getByText('2 items')).toBeTruthy();
  });

  it('gives immediate title feedback and creates a ToDo with valid input', async () => {
    const user = userEvent.setup();
    const createdTodo = { ...firstTodo, title: 'Call the dentist' };
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(createdTodo, 201));
    render(<App />);

    const titleInput = await screen.findByRole('textbox', { name: /title/i });
    const submitButton = screen.getByRole('button', { name: 'Add ToDo' });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    await user.type(titleInput, '   ');
    expect(screen.getByRole('alert').textContent).toBe('Please enter a title for your ToDo.');
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    await user.clear(titleInput);
    await user.type(titleInput, 'Call the dentist');
    await user.click(submitButton);

    expect(await screen.findByRole('heading', { name: 'Call the dentist' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('ToDo added.');
    const createRequest = fetchMock.mock.calls[1];
    expect(createRequest?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(createRequest?.[1]?.body))).toMatchObject({
      title: 'Call the dentist',
      description: null,
      dueDateTime: null,
    });
  });

  it('allows editing and completing a ToDo', async () => {
    const user = userEvent.setup();
    const editedTodo = { ...firstTodo, title: 'Buy groceries today' };
    const finishedTodo = { ...editedTodo, isCompleted: true };
    fetchMock
      .mockResolvedValueOnce(jsonResponse([firstTodo]))
      .mockResolvedValueOnce(jsonResponse(editedTodo))
      .mockResolvedValueOnce(jsonResponse(finishedTodo));
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Edit Buy groceries' }));
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, editedTodo.title);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { name: editedTodo.title })).toBeTruthy();
    await user.click(screen.getByRole('checkbox', { name: 'Mark “Buy groceries today” as complete' }));
    expect((await screen.findByRole('status')).textContent).toBe('ToDo completed.');
    expect(screen.queryByRole('heading', { name: editedTodo.title })).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: 'Show completed (1)' }));
    expect(screen.getByRole('heading', { name: editedTodo.title })).toBeTruthy();
  });

  it('removes a ToDo after the user confirms deletion', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse([firstTodo]))
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(jsonResponse([]));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Delete Buy groceries' }));

    expect(await screen.findByText('Nothing on your list yet.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('ToDo deleted.');
  });

  it('confirms deletion and refreshes the list after a stale ToDo response', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse([firstTodo]))
      .mockResolvedValueOnce(jsonResponse({
        error: { code: 'TODO_NOT_FOUND', message: 'The requested ToDo could not be found.' },
      }, 404))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Delete Buy groceries' }));

    expect(window.confirm).toHaveBeenCalledWith('Delete “Buy groceries”? This cannot be undone.');
    expect(alertMock).toHaveBeenCalledWith('The requested ToDo could not be found.');
    expect(await screen.findByText('Nothing on your list yet.')).toBeTruthy();
  });

  it('shows a network error and lets the user retry loading', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockRejectedValueOnce(new TypeError('network unavailable'))
      .mockResolvedValueOnce(jsonResponse([firstTodo]));
    render(<App />);

    expect(await screen.findByText(/Could not connect to the server/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Buy groceries' })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('sets the date input minimum and reports a past date immediately', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    render(<App />);

    const dueDateInput = await screen.findByLabelText(/Due date and time/i) as HTMLInputElement;
    expect(dueDateInput.min).not.toBe('');

    fireEvent.change(dueDateInput, { target: { value: '2000-01-01T10:00' } });
    expect(screen.getByRole('alert').textContent).toBe('Please choose a future due date and time.');
    expect((screen.getByRole('button', { name: 'Add ToDo' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
