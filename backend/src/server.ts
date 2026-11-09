import express, { type ErrorRequestHandler } from 'express';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { todoRoutes } from './routes/todoRoutes.js';
import { TodoServiceError } from './services/todoService.js';

class RouteNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'ROUTE_NOT_FOUND';

  constructor() {
    super('Route not found');
  }
}

export const app = express();

app.use(express.json());

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/api/todos', todoRoutes);

app.use((_request, _response, next) => {
  next(new RouteNotFoundError());
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof TodoServiceError || error instanceof RouteNotFoundError) {
    response.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Request body contains invalid JSON' },
    });
    return;
  }

  console.error('Unexpected request error:', error);
  response.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
  });
};

app.use(errorHandler);

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT) || 3008;

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}
