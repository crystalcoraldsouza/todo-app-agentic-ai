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

```js
/
├── frontend/
├── backend/
├── PLAN.md
├── AGENTS.md
└── README.md
```

## Getting Started

The frontend and backend run independently. Each application has its own dependencies and development commands.

### Prerequisites

- Node.js (version to be confirmed)
- npm

### Frontend

```js
cd frontend
npm run dev
```

### Backend

```js
cd backend
npm run dev
```

## Design & Architecture

### Frontend

To be documented following implementation.

### Backend

To be documented following implementation.

### Behaviour & Assumptions

ToDo ordering, date and time handling, completed-item visibility and other behavioural assumptions are documented in the implementation plan.

### Validation & Error Handling

To be documented following implementation, including input validation, error responses and data consistency.

### Testing

Automated tests cover relevant application behaviour, validation and failure scenarios.

Detailed test instructions and verification results will be documented as implementation progresses.

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
