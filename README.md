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
│   ├── package.json
│   └── package-lock.json
├── backend/data/ (local SQLite database, gitignored)
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

Install dependencies from the repository root, then run the development server from `frontend/`:

```sh
cd frontend
npm install
npm run dev
```

Vite serves the development app at `http://localhost:5173` by default. Node.js 24 or later is required.

The frontend currently displays a basic Hello World page; ToDo management features are planned.

### Backend

Install backend dependencies and start the development server from the repository root:

```sh
cd backend
npm install
npm run dev
```

The backend listens on port `3008` by default. Set the `PORT` environment variable to use a different port. The `GET /health` endpoint returns HTTP 200 with `{ "status": "ok" }`.

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

Create requests require a non-empty `title`; `description` and `dueDateTime` are optional. Due dates must be ISO 8601 UTC values ending in `Z`. PATCH accepts `title`, `description`, `dueDateTime`, and `isCompleted`; omitted fields stay unchanged, and `null` clears description or due date. The backend generates IDs, ordinals, and timestamps. Invalid input and malformed UUIDs return HTTP 400; a valid UUID with no matching ToDo returns HTTP 404. The API returns both completed and incomplete records; visibility filtering is a frontend responsibility.

## Design & Architecture

### Frontend

To be documented following implementation.

### Backend

The backend uses Node.js, TypeScript, Express 5, and Node's built-in `node:sqlite` module. Routes, controllers, services, and database code are kept in separate layers. It provides the health endpoint and the ToDo CRUD API described above.

### Behaviour & Assumptions

ToDo ordering, date and time handling, completed-item visibility and other behavioural assumptions are documented in the implementation plan.

### Validation & Error Handling

To be documented following implementation, including input validation, error responses and data consistency.

### Testing

Automated tests are not configured or implemented. The health endpoint and ToDo API can be verified manually while the backend is running.

### AI-Assisted Development

AI development tools are used to support planning, implementation and testing. Technical decisions, generated changes and test results are reviewed and verified as part of the development process.

The repository includes an `AGENTS.md` file containing persistent guidelines for AI coding agents. It defines coding standards, naming conventions, development workflow, testing practices and Git commit conventions to maintain consistency throughout development.

## Time Spent

| Task           | Time Spent |
| -------------- | ---------- |
| Planning       |            |
| Implementation |            |
| Testing        |            |
| Documentation  |            |

## Known Limitations & Future Work
