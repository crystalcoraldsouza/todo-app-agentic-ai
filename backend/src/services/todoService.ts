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
    readonly code: 'VALIDATION_ERROR' | 'TODO_NOT_FOUND',
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
    throw new TodoServiceError(
      `The field '${unsupportedField}' is not supported.`,
      400,
      'VALIDATION_ERROR',
    );
  }
}

function validateRequestBody(input: unknown): asserts input is Record<string, unknown> {
  if (!isRecord(input)) {
    throw new TodoServiceError(
      'Please provide a valid JSON object.',
      400,
      'VALIDATION_ERROR',
    );
  }
}

function validateTitle(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TodoServiceError('Please provide a title.', 400, 'VALIDATION_ERROR');
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

  const fieldLabel = fieldName === 'description' ? 'Description' : 'Due date and time';
  throw new TodoServiceError(`${fieldLabel} must be text or empty.`, 400, 'VALIDATION_ERROR');
}

function isValidUtcDateTime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day, hour, minute, second, fraction] = match;
  const date = new Date(value);

  return Number.isFinite(date.getTime()) &&
    date.toISOString() === `${year}-${month}-${day}T${hour}:${minute}:${second}.${(fraction ?? '').padEnd(3, '0').slice(0, 3)}Z`;
}

function validateDueDateTime(value: unknown): string | null {
  const dueDateTime = validateOptionalString(value, 'dueDateTime');

  if (dueDateTime === null) {
    return null;
  }

  const dateValue = dueDateTime.trim();

  if (!isValidUtcDateTime(dateValue)) {
    throw new TodoServiceError(
      'Please provide a valid due date and time in UTC.',
      400,
      'VALIDATION_ERROR',
    );
  }

  return dueDateTime;
}

function validateUuid(value: unknown): asserts value is string {
  const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    throw new TodoServiceError('The ToDo ID is invalid.', 400, 'VALIDATION_ERROR');
  }
}

export function getTodos(): Todo[] {
  return queryTodos();
}

export function createTodo(input: unknown): Todo {
  validateRequestBody(input);

  validateAllowedFields(input, ['title', 'description', 'dueDateTime']);

  if (!Object.hasOwn(input, 'title')) {
    throw new TodoServiceError('Please provide a title.', 400, 'VALIDATION_ERROR');
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

  validateRequestBody(input);

  if (Object.keys(input).length === 0) {
    throw new TodoServiceError(
      'Please provide at least one field to update.',
      400,
      'VALIDATION_ERROR',
    );
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
      throw new TodoServiceError(
        'Completion status must be true or false.',
        400,
        'VALIDATION_ERROR',
      );
    }

    validatedInput.isCompleted = input.isCompleted;
  }

  const todo = updateTodoRecord(id, validatedInput, new Date().toISOString());

  if (!todo) {
    throw new TodoServiceError('The requested ToDo could not be found.', 404, 'TODO_NOT_FOUND');
  }

  return todo;
}

export function deleteTodo(id: unknown): void {
  validateUuid(id);

  if (!removeTodo(id)) {
    throw new TodoServiceError('The requested ToDo could not be found.', 404, 'TODO_NOT_FOUND');
  }
}
