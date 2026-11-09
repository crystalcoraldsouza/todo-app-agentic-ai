import type { Request, Response } from 'express';
import {
  createTodo as createTodoRecord,
  deleteTodo as deleteTodoRecord,
  getTodos as getTodoRecords,
  TodoServiceError,
  updateTodo as updateTodoRecord,
} from '../services/todoService.js';

function sendServiceError(response: Response, error: unknown): void {
  if (!(error instanceof TodoServiceError)) {
    throw error;
  }

  response.status(error.statusCode).json({ error: error.message });
}

export function getTodos(_request: Request, response: Response): void {
  response.status(200).json(getTodoRecords());
}

export function createTodo(request: Request, response: Response): void {
  try {
    const body: unknown = request.body;
    response.status(201).json(createTodoRecord(body));
  } catch (error) {
    sendServiceError(response, error);
  }
}

export function updateTodo(request: Request, response: Response): void {
  try {
    const body: unknown = request.body;
    response.status(200).json(updateTodoRecord(request.params.id, body));
  } catch (error) {
    sendServiceError(response, error);
  }
}

export function deleteTodo(request: Request, response: Response): void {
  try {
    deleteTodoRecord(request.params.id);
    response.status(204).end();
  } catch (error) {
    sendServiceError(response, error);
  }
}
