import { Router } from 'express';
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from '../controllers/todoController.js';

export const todoRoutes = Router();

todoRoutes.get('/', getTodos);
todoRoutes.post('/', createTodo);
todoRoutes.patch('/:id', updateTodo);
todoRoutes.delete('/:id', deleteTodo);
