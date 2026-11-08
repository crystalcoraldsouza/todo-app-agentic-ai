# AGENTS.md

## 1. General Principles

- Prioritise simplicity, readability and maintainability over unnecessary abstraction.
- Follow the principle of least complexity. Avoid overengineering.
- Prefer existing project conventions and established patterns over introducing new ones.
- Avoid unnecessary dependencies. Justify any proposed additions.
- Keep implementations focused and proportionate to the requirements.
- Do not introduce functionality outside the scope of the requested task.

## 2. AI Development Workflow

- Read `README.md` and `PLAN.md` to understand the project and its intended direction.
- Inspect relevant existing code before proposing changes.
- Explain your understanding of the task and proposed implementation before making changes.
- Identify ambiguities, assumptions, inconsistencies or conflicts with the implementation plan.
- **Do not create, modify or delete files without explicit user approval.**
- Present the proposed files, changes and rationale clearly, then wait for approval.
- Implement only the approved scope. Do not proceed to additional tasks without approval.
- If the implementation requires a change in approach, explain the reason and seek approval.
- Do not commit changes. Git staging and commits are managed by the user.
- After implementation, summarise changes, decisions, tests executed and any outstanding issues.

## 3. Coding Standards

### General

- Use TypeScript throughout the frontend and backend.
- Follow modern ECMAScript (ES6+) conventions and features supported by the project.
- Prefer `const` by default and use `let` when reassignment is required. Avoid `var`.
- Use `async/await` for asynchronous operations.
- Prefer descriptive names over abbreviations.
- Keep functions focused and avoid unnecessary complexity.
- Handle errors explicitly rather than silently suppressing them.

### TypeScript

- Avoid using `any`. Prefer explicit types, type inference where appropriate, and `unknown` for values that require runtime narrowing.
- Define clear interfaces and types for application data and function contracts.
- Avoid unnecessary type assertions and non-null assertions.
- Respect TypeScript strictness settings.
- Do not suppress TypeScript errors simply to make the build pass.

### Naming Conventions

- Use `PascalCase` for React components, classes and type/interface names.
- Use `camelCase` for variables, functions, methods and object properties.
- Use `UPPER_SNAKE_CASE` for true module-level constants where appropriate.
- Use descriptive, consistent file and folder names.
- Prefix React hooks with `use`.
- Prefix boolean variables with meaningful terms such as `is`, `has`, `can` or `should`.

### React

- Prefer functional components and React hooks.
- Keep components focused on a clear responsibility.
- Avoid unnecessary component abstraction and prop drilling solutions unless justified.
- Follow React's rules of hooks.
- Keep UI concerns separate from business logic where appropriate.

## 4. Project Structure

- Maintain clear separation between frontend and backend responsibilities.
- Keep related functionality organised together.
- Avoid unnecessary nesting and excessive file fragmentation.
- Follow the existing project structure unless a change is justified and approved.

## 5. Testing & Verification

- Add or update tests for new functionality and bug fixes.
- Cover meaningful success cases, validation rules and failure scenarios.
- Run relevant tests and report their actual results.
- Do not claim functionality is verified unless the relevant checks have been executed.
- Do not ignore or suppress failing tests without investigation.

## 6. Documentation

- Keep documentation concise and consistent with the implementation.
- Update `PLAN.md` when approved design decisions or implementation approaches change.
- Update the relevant README when setup instructions, functionality or technical decisions change.
- Do not document assumptions as implemented behaviour.

## 7. Git & Commit Conventions

- Follow the Conventional Commits format: <type>(<scope>): <description>.
- Use imperative mood for commit descriptions (e.g. add, update, fix, remove).
- Use lowercase descriptions and keep them concise and meaningful.
- Use appropriate commit types such as feat, fix, docs, test, refactor and chore.
- Each commit should represent one logical, coherent change.
- Do not create commits or modify Git history without explicit user approval.
