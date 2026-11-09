import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultDatabasePath = fileURLToPath(new URL('../../data/todos.sqlite', import.meta.url));
const databasePath = process.env.TODO_DATABASE_PATH ?? defaultDatabasePath;
const databaseDirectory = dirname(databasePath);

mkdirSync(databaseDirectory, { recursive: true });

export const database = new DatabaseSync(databasePath);

database.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    dueDateTime TEXT,
    ordinal INTEGER NOT NULL,
    isCompleted INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);
