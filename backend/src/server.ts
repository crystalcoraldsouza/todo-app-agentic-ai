import express from 'express';
import { todoRoutes } from './routes/todoRoutes.js';

const app = express();
const port = Number(process.env.PORT) || 3008;

app.use(express.json());

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/api/todos', todoRoutes);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
