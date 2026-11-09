import type { Request, Response } from 'express';
import {
  createTodo as createTodoRecord,
  deleteTodo as deleteTodoRecord,
  getTodos as getTodoRecords,
  updateTodo as updateTodoRecord,
} from '../services/todoService.js';

export function getTodos(_request: Request, response: Response): void {
  response.status(200).json(getTodoRecords());
}

export function createTodo(request: Request, response: Response): void {
  const body: unknown = request.body;
  response.status(201).json(createTodoRecord(body));
}

export function updateTodo(request: Request, response: Response): void {
  const body: unknown = request.body;
  response.status(200).json(updateTodoRecord(request.params.id, body));
}

export function deleteTodo(request: Request, response: Response): void {
  deleteTodoRecord(request.params.id);
  response.status(204).end();
}
