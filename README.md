# TODO APP

This is a todo application for a single user to maintain a todo list built with React, TypeScript and Node.

## Features

- View and manage a personal ToDo list.
- Create, edit and delete ToDos.
- Mark ToDos as complete or incomplete.
- Hide completed ToDos by default, with an option to show them.
- Maintain task ordering using an ordinal position.
- Assign a due date and time to each ToDo.

## Project Structure

The project is organised as a monorepo containing two independent applications:

```text
/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── server.ts
│   ├── tests/
│   ├── data/ (local SQLite database, gitignored)
│   ├── package.json
│   └── package-lock.json
├── .gitignore
├── .nvmrc
├── PLAN.md
├── AGENTS.md
└── README.md
```

## Getting Started

The frontend and backend run independently. Each application has its own dependencies and development commands.

### Prerequisites

- Node.js 24 or later
- npm

NVM is optional. If you use NVM, run `nvm use` from the repository root to select the project's preferred Node.js version.

### Frontend

Install frontend dependencies and start its development server from `frontend/`:

```sh
cd frontend
npm install
npm run dev
```

Vite serves the development app at `http://localhost:5173` by default. Node.js 24 or later is required.

The frontend provides a ToDo interface for creating, editing, completing and deleting items. It loads and saves data through the backend API, which stores ToDos in SQLite. Run the backend alongside the frontend when using the interface.

### Backend

Install backend dependencies and start the development server from the repository root:

```sh
cd backend
npm install
npm run dev
```

The backend listens on port `3008` by default. Set the `PORT` environment variable to use a different port. The `GET /health` endpoint returns HTTP 200 with `{ "status": "ok" }`.

In development, Vite proxies frontend `/api` requests to the backend at `http://localhost:3008`.

The backend stores ToDos in `backend/data/todos.sqlite`, created automatically at startup. The database directory is excluded from Git.

Run backend checks and create a production build from `backend/`:

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

The production start command runs the compiled JavaScript with Node.js.

### ToDo API

The API is available under `/api/todos`:

| Method   | Endpoint         | Behavior                                                               |
| -------- | ---------------- | ---------------------------------------------------------------------- |
| `GET`    | `/api/todos`     | Returns all ToDos, ordered by ordinal.                                 |
| `POST`   | `/api/todos`     | Creates a ToDo and returns HTTP 201 with the created record.           |
| `PATCH`  | `/api/todos/:id` | Partially updates a ToDo and returns HTTP 200 with the updated record. |
| `DELETE` | `/api/todos/:id` | Deletes a ToDo and returns HTTP 204.                                   |

Create requests require a non-empty `title`; `description` and `dueDateTime` are optional. Due dates must be ISO 8601 UTC values ending in `Z`. PATCH accepts `title`, `description`, `dueDateTime`, and `isCompleted`; omitted fields stay unchanged, and `null` clears description or due date. The backend generates IDs, ordinals, and timestamps. Malformed JSON and other invalid input return a structured HTTP 400 response; a valid UUID with no matching ToDo or an unknown route returns HTTP 404. Unexpected server errors are logged and returned as a generic HTTP 500 response. The API returns both completed and incomplete records; visibility filtering is a frontend responsibility.

Create a ToDo:

```sh
curl -X POST http://localhost:3008/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Review the proposal","description":"Check the details"}'
```

Update a ToDo (replace the example ID with one returned by the API):

```sh
curl -X PATCH http://localhost:3008/api/todos/replace-with-todo-id \
  -H 'Content-Type: application/json' \
  -d '{"isCompleted":true}'
```

## Design & Architecture

### Frontend

The frontend is a React, TypeScript and Vite application. It uses native `fetch` to communicate with the backend API. Completed ToDos are hidden by default and can be shown with the list control; the item count reflects the visible list. The form validates as values change and disables saving when invalid. Due dates display in local time, past due dates are rejected by the frontend, and deletion requires confirmation. If an operation finds that a ToDo has already been removed, the list is refreshed; delete failures are shown in a browser alert.

### Backend

The backend uses Node.js, TypeScript, Express 5 and Node's built-in `node:sqlite` module. Routes, controllers, services and database operations are kept in separate layers. The database is initialized automatically at startup.

### Behaviour & Assumptions

The API returns all ToDos in ordinal order. New items are appended; updates and deletions do not renumber existing items, and a deleted highest ordinal may be reused. The frontend hides completed items by default and lets users show them.

ToDo IDs and timestamps are generated by the backend. `createdAt` remains unchanged after creation, while `updatedAt` is refreshed after every successful PATCH, even when supplied values are unchanged. PATCH changes only supplied fields. Omitted optional fields remain unchanged; `null`, empty strings and whitespace-only strings clear description or due date. Nonblank titles and optional text values are preserved as supplied, including surrounding whitespace; the frontend preserves title spacing when displaying it.

### Validation & Error Handling

The backend requires a nonblank title, validates supported field types and valid ISO 8601 UTC due dates ending in `Z`, and rejects unsupported fields and malformed request bodies. It returns structured errors for invalid requests, invalid IDs, missing ToDos and unknown routes; unexpected errors receive a generic HTTP 500 response. There are no title or description length limits. The frontend rejects past due dates, while the backend checks date format and calendar validity without requiring a future date.

### Testing

Automated frontend tests use Vitest and React Testing Library. From `frontend/`, run `npm test`; all 9 tests passed. They cover visibility, create/edit/complete/delete interactions, validation, error feedback, stale-item refresh and date handling. Frontend lint and `npm run build` passed; the build includes the TypeScript check.

Backend API integration tests use Node.js's built-in test runner and a temporary SQLite database. From `backend/`, run `npm test`; the integration test passed. It covers CRUD, validation and error responses, persistence, ordering, timestamps and concurrent creation. Backend lint, typecheck and build passed. Run `npm run test:report` to generate a JUnit report at `backend/test-results.xml`; the report is excluded from Git.

I also manually exercised backend CRUD and valid and invalid inputs in Postman. Separately, a CRUD request check through the Vite development proxy passed. I reviewed the UI manually during development and used those observations to guide usability and presentation refinements. These were informal checks; no formal accessibility audit or exhaustive browser testing was performed.

### AI-Assisted Development

I used Codex iteratively, working through the plan in stages and smaller implementation steps. Codex was instructed to inspect the project instructions, plan, README and relevant code before implementation. I reviewed proposals and diffs, gave feedback, approved the scoped steps, and reviewed verification results before committing. I guided decisions toward simple implementations and away from unnecessary abstractions or scope expansion. Corrections included preserving entered title whitespace in the rendered list, rejecting past due dates in the frontend, and refreshing stale list data after an API not-found response.

The repository includes an `AGENTS.md` file containing persistent guidelines for AI coding agents. It defines coding standards, naming conventions, development workflow, testing practices and Git commit conventions to maintain consistency throughout development.

## Time Spent

| Task           | Time Spent            |
| -------------- | --------------------- |
| Planning       | 2 hours 45 minutes    |
| Implementation | 1 hour                |
| Testing        | 1 hour                |
| Documentation  | 45 minutes            |
| **Total**      | **5 hours 30 minutes** |

## Known Limitations & Future Work

- Manual ToDo reordering is not currently supported; the backend assigns ordinal positions automatically.
- Deletion is permanent. Soft deletion and recovery may be considered if future requirements justify them.
- The application currently supports a single user; authentication and multi-user support are outside the initial scope.
- Concurrent updates use a last-write-wins approach. Optimistic locking, versioning and more advanced concurrency controls are deferred unless future requirements justify them.
- Swagger / OpenAPI documentation may be added in future; it is not currently implemented.
