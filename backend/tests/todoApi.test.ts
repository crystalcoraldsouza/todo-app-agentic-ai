import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'todo-api-test-'));
const databasePath = join(temporaryDirectory, 'todos.sqlite');
process.env.TODO_DATABASE_PATH = databasePath;

let server: Server | undefined;
let baseUrl = '';
let testDatabase: DatabaseSync | undefined;

before(async () => {
  const { app } = await import('../src/server.js');
  const databaseModule = await import('../src/database/database.js');
  testDatabase = databaseModule.database;

  server = app.listen(0);
  await once(server, 'listening');

  const address = server.address();
  assert(address && typeof address !== 'string');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  }

  testDatabase?.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function sendJson(path: string, method: string, body?: unknown): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function errorBody(response: Response): Promise<{ error: { code: string; message: string } }> {
  return response.json() as Promise<{ error: { code: string; message: string } }>;
}

test('ToDo API validates requests and preserves CRUD data behavior', async () => {
  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });

  for (const body of [undefined, null, [], 'text', 12, true]) {
    const response = await sendJson('/api/todos', 'POST', body);
    assert.equal(response.status, 400);
    assert.equal((await errorBody(response)).error.code, 'VALIDATION_ERROR');
  }

  const unknownFieldResponse = await sendJson('/api/todos', 'POST', {
    title: 'Task',
    priority: 'high',
  });
  assert.equal(unknownFieldResponse.status, 400);
  assert.match((await errorBody(unknownFieldResponse)).error.message, /priority/);

  const invalidTitleResponse = await sendJson('/api/todos', 'POST', { title: '   ' });
  assert.equal(invalidTitleResponse.status, 400);

  const invalidDateResponse = await sendJson('/api/todos', 'POST', {
    title: 'Invalid date',
    dueDateTime: '2026-02-30T12:00:00Z',
  });
  assert.equal(invalidDateResponse.status, 400);

  const emptyPatchResponse = await sendJson('/api/todos/00000000-0000-4000-8000-000000000000', 'PATCH', {});
  assert.equal(emptyPatchResponse.status, 400);
  assert.equal(
    (await errorBody(emptyPatchResponse)).error.message,
    'Please provide at least one field to update.',
  );

  const malformedJsonResponse = await fetch(`${baseUrl}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid json',
  });
  assert.equal(malformedJsonResponse.status, 400);
  assert.equal((await errorBody(malformedJsonResponse)).error.code, 'VALIDATION_ERROR');

  const unknownRouteResponse = await fetch(`${baseUrl}/not-a-route`);
  assert.equal(unknownRouteResponse.status, 404);
  assert.equal((await errorBody(unknownRouteResponse)).error.code, 'ROUTE_NOT_FOUND');

  const initialListResponse = await fetch(`${baseUrl}/api/todos`);
  assert.equal(initialListResponse.status, 200);
  assert.deepEqual(await initialListResponse.json(), []);

  const createResponse = await sendJson('/api/todos', 'POST', {
    title: '  First task  ',
    description: '  Details  ',
    dueDateTime: '  2026-11-12T16:30:00Z  ',
  });
  assert.equal(createResponse.status, 201);
  const createdTodo = await createResponse.json() as {
    id: string;
    title: string;
    description: string | null;
    dueDateTime: string | null;
    ordinal: number;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  assert.match(createdTodo.id, /^[0-9a-f-]{36}$/i);
  assert.equal(createdTodo.title, '  First task  ');
  assert.equal(createdTodo.description, '  Details  ');
  assert.equal(createdTodo.dueDateTime, '  2026-11-12T16:30:00Z  ');
  assert.equal(createdTodo.ordinal, 0);
  assert.equal(createdTodo.isCompleted, false);
  assert.equal(createdTodo.createdAt, createdTodo.updatedAt);

  const secondCreateResponse = await sendJson('/api/todos', 'POST', { title: 'Second task' });
  assert.equal(secondCreateResponse.status, 201);
  const secondTodo = await secondCreateResponse.json() as { id: string; ordinal: number };
  assert.equal(secondTodo.ordinal, 1);

  const missingTodoResponse = await sendJson(
    '/api/todos/00000000-0000-4000-8000-000000000000',
    'PATCH',
    { title: 'Missing' },
  );
  assert.equal(missingTodoResponse.status, 404);
  assert.equal((await errorBody(missingTodoResponse)).error.code, 'TODO_NOT_FOUND');

  const malformedIdResponse = await sendJson('/api/todos/not-a-uuid', 'DELETE');
  assert.equal(malformedIdResponse.status, 400);

  await new Promise((resolve) => setTimeout(resolve, 5));
  const updateResponse = await sendJson(`/api/todos/${createdTodo.id}`, 'PATCH', {
    title: createdTodo.title,
    description: '   ',
    isCompleted: true,
  });
  assert.equal(updateResponse.status, 200);
  const updatedTodo = await updateResponse.json() as typeof createdTodo;
  assert.equal(updatedTodo.title, createdTodo.title);
  assert.equal(updatedTodo.description, null);
  assert.equal(updatedTodo.ordinal, createdTodo.ordinal);
  assert.equal(updatedTodo.createdAt, createdTodo.createdAt);
  assert.notEqual(updatedTodo.updatedAt, createdTodo.updatedAt);
  assert.equal(updatedTodo.isCompleted, true);

  const deleteResponse = await fetch(`${baseUrl}/api/todos/${secondTodo.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 204);

  const concurrentResponses = await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      sendJson('/api/todos', 'POST', { title: `Concurrent task ${index}` }),
    ),
  );
  assert(concurrentResponses.every((response) => response.status === 201));
  const concurrentTodos = await Promise.all(
    concurrentResponses.map((response) => response.json() as Promise<{ ordinal: number }>),
  );
  assert.deepEqual(
    concurrentTodos.map((todo) => todo.ordinal).sort((left, right) => left - right),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );

  const finalListResponse = await fetch(`${baseUrl}/api/todos`);
  const finalTodos = await finalListResponse.json() as Array<{ ordinal: number }>;
  assert.deepEqual(
    finalTodos.map((todo) => todo.ordinal),
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  );

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => (error ? reject(error) : resolve()));
  });
  server = undefined;
  testDatabase?.close();
  testDatabase = undefined;

  const reopenedDatabase = new DatabaseSync(databasePath);
  const persistedCount = reopenedDatabase.prepare('SELECT COUNT(*) AS count FROM todos').get() as
    | { count: number }
    | undefined;
  assert.equal(persistedCount?.count, 9);
  reopenedDatabase.close();
});
