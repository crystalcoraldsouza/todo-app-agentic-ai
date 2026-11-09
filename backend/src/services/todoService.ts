import { randomUUID } from 'node:crypto';
import {
  createTodo as insertTodo,
  deleteTodo as removeTodo,
  listTodos as queryTodos,
  updateTodo as updateTodoRecord,
} from '../database/todoQueries.js';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../types/todo.js';

export class TodoServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: 400 | 404,
  ) {
    super(message);
    this.name = 'TodoServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateAllowedFields(
  input: Record<string, unknown>,
  allowedFields: readonly string[],
): void {
  const unsupportedField = Object.keys(input).find(
    (field) => !allowedFields.includes(field),
  );

  if (unsupportedField) {
    throw new TodoServiceError(`Unsupported field: ${unsupportedField}`, 400);
  }
}

function validateTitle(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TodoServiceError('title must be a non-empty string', 400);
  }

  return value;
}

function validateOptionalString(
  value: unknown,
  fieldName: string,
): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0 ? null : value;
  }

  throw new TodoServiceError(`${fieldName} must be a string or null`, 400);
}

function validateDueDateTime(value: unknown): string | null {
  const dueDateTime = validateOptionalString(value, 'dueDateTime');

  if (dueDateTime === null) {
    return null;
  }

  const dateValue = dueDateTime.match(/^\s*(.*?)\s*$/)?.[1] ?? '';

  if (!dateValue.endsWith('Z') || !Number.isFinite(Date.parse(dateValue))) {
    throw new TodoServiceError(
      'dueDateTime must be a valid ISO 8601 UTC date/time ending in Z or null',
      400,
    );
  }

  return dueDateTime;
}

function validateUuid(value: unknown): asserts value is string {
  const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new TodoServiceError('ToDo ID must be a valid UUID', 400);
  }
}

export function getTodos(): Todo[] {
  return queryTodos();
}

export function createTodo(input: unknown): Todo {
  if (!isRecord(input)) {
    throw new TodoServiceError('Request body must be an object', 400);
  }

  validateAllowedFields(input, ['title', 'description', 'dueDateTime']);

  if (!Object.hasOwn(input, 'title')) {
    throw new TodoServiceError('title is required', 400);
  }

  const validatedInput: CreateTodoInput = {
    title: validateTitle(input.title),
    description: Object.hasOwn(input, 'description')
      ? validateOptionalString(input.description, 'description')
      : null,
    dueDateTime: Object.hasOwn(input, 'dueDateTime')
      ? validateDueDateTime(input.dueDateTime)
      : null,
  };
  const timestamp = new Date().toISOString();

  return insertTodo(validatedInput, randomUUID(), timestamp);
}

export function updateTodo(id: unknown, input: unknown): Todo {
  validateUuid(id);

  if (!isRecord(input)) {
    throw new TodoServiceError('Request body must be an object', 400);
  }

  if (Object.keys(input).length === 0) {
    throw new TodoServiceError('PATCH request body must not be empty', 400);
  }

  validateAllowedFields(input, ['title', 'description', 'dueDateTime', 'isCompleted']);

  const validatedInput: UpdateTodoInput = {};

  if (Object.hasOwn(input, 'title')) {
    validatedInput.title = validateTitle(input.title);
  }

  if (Object.hasOwn(input, 'description')) {
    validatedInput.description = validateOptionalString(input.description, 'description');
  }

  if (Object.hasOwn(input, 'dueDateTime')) {
    validatedInput.dueDateTime = validateDueDateTime(input.dueDateTime);
  }

  if (Object.hasOwn(input, 'isCompleted')) {
    if (typeof input.isCompleted !== 'boolean') {
      throw new TodoServiceError('isCompleted must be a boolean', 400);
    }

    validatedInput.isCompleted = input.isCompleted;
  }

  const todo = updateTodoRecord(id, validatedInput, new Date().toISOString());

  if (!todo) {
    throw new TodoServiceError('ToDo not found', 404);
  }

  return todo;
}

export function deleteTodo(id: unknown): void {
  validateUuid(id);

  if (!removeTodo(id)) {
    throw new TodoServiceError('ToDo not found', 404);
  }
}
