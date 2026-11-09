import { database } from './database.js';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../types/todo.js';

type DatabaseRow = Record<string, unknown>;

function mapTodoRow(row: DatabaseRow): Todo {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    dueDateTime: row.dueDateTime as string | null,
    ordinal: row.ordinal as number,
    isCompleted: row.isCompleted === 1,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

const listTodosStatement = database.prepare(
  'SELECT id, title, description, dueDateTime, ordinal, isCompleted, createdAt, updatedAt FROM todos ORDER BY ordinal ASC',
);

export function listTodos(): Todo[] {
  return listTodosStatement.all().map(mapTodoRow);
}

export function createTodo(
  input: CreateTodoInput,
  id: string,
  timestamp: string,
): Todo {
  const statement = database.prepare(`
    INSERT INTO todos (
      id, title, description, dueDateTime, ordinal, isCompleted, createdAt, updatedAt
    )
    VALUES (
      ?, ?, ?, ?, COALESCE((SELECT MAX(ordinal) + 1 FROM todos), 0), 0, ?, ?
    )
    RETURNING id, title, description, dueDateTime, ordinal, isCompleted, createdAt, updatedAt
  `);
  const row = statement.get(
    id,
    input.title,
    input.description,
    input.dueDateTime,
    timestamp,
    timestamp,
  );

  if (!row) {
    throw new Error('Created ToDo could not be retrieved');
  }

  return mapTodoRow(row);
}

export function updateTodo(
  id: string,
  input: UpdateTodoInput,
  timestamp: string,
): Todo | undefined {
  const assignments: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.title !== undefined) {
    assignments.push('title = ?');
    values.push(input.title);
  }

  if (input.description !== undefined) {
    assignments.push('description = ?');
    values.push(input.description);
  }

  if (input.dueDateTime !== undefined) {
    assignments.push('dueDateTime = ?');
    values.push(input.dueDateTime);
  }

  if (input.isCompleted !== undefined) {
    assignments.push('isCompleted = ?');
    values.push(input.isCompleted ? 1 : 0);
  }

  assignments.push('updatedAt = ?');
  values.push(timestamp, id);

  const statement = database.prepare(`
    UPDATE todos
    SET ${assignments.join(', ')}
    WHERE id = ?
    RETURNING id, title, description, dueDateTime, ordinal, isCompleted, createdAt, updatedAt
  `);
  const row = statement.get(...values);

  return row ? mapTodoRow(row) : undefined;
}

export function deleteTodo(id: string): boolean {
  const result = database.prepare('DELETE FROM todos WHERE id = ?').run(id);
  return result.changes > 0;
}
