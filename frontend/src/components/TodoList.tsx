import type { Todo } from '../todoService.js';
import { formatDueDate } from '../todoDateTime.js';

interface TodoListProps {
  todos: Todo[];
  showCompleted: boolean;
  completedCount: number;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string;
  actionError: string;
  onShowCompletedChange: (show: boolean) => void;
  onRetry: () => void;
  onToggleCompleted: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

function TodoList({
  todos,
  showCompleted,
  completedCount,
  isLoading,
  isSaving,
  loadError,
  actionError,
  onShowCompletedChange,
  onRetry,
  onToggleCompleted,
  onEdit,
  onDelete,
}: TodoListProps) {
  const visibleTodos = todos.filter((todo) => showCompleted || !todo.isCompleted);

  return (
    <section className="todo-section" aria-labelledby="todo-list-heading">
      <div className="section-heading">
        <div>
          <h2 id="todo-list-heading">Your ToDos</h2>
          <p className="muted-text">
            {todos.length === 0
              ? 'Nothing on your list yet.'
              : `${visibleTodos.length} ${visibleTodos.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>
        <label className="toggle-completed">
          <input
            type="checkbox"
            checked={showCompleted}
            disabled={isSaving}
            onChange={(event) => onShowCompletedChange(event.target.checked)}
          />
          <span>Show completed ({completedCount})</span>
        </label>
      </div>

      {actionError && <p className="form-error" role="alert">{actionError}</p>}

      {isLoading ? (
        <p role="status">Loading ToDos…</p>
      ) : loadError ? (
        <div role="alert">
          <p className="form-error">{loadError}</p>
          <button className="secondary-button" type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : visibleTodos.length === 0 ? (
        <p className="empty-state">
          {todos.length > 0
            ? 'All done. Show completed ToDos to see them here.'
            : 'Add your first ToDo using the form.'}
        </p>
      ) : (
        <ul className="todo-list">
          {visibleTodos.map((todo) => {
            const displayTitle = todo.title;

            return (
            <li className={`todo-card${todo.isCompleted ? ' is-completed' : ''}`} key={todo.id}>
              <div className="todo-main">
                <label className="completion-control">
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    disabled={isSaving}
                    onChange={() => onToggleCompleted(todo)}
                  />
                  <span className="visually-hidden">
                    Mark “{displayTitle}” as {todo.isCompleted ? 'incomplete' : 'complete'}
                  </span>
                </label>
                <div className="todo-copy">
                  <h3>{displayTitle}</h3>
                  {todo.description && <p>{todo.description}</p>}
                  {todo.dueDateTime && (
                    <p className="due-date">Due {formatDueDate(todo.dueDateTime)}</p>
                  )}
                </div>
              </div>
              <div className="todo-actions" role="group" aria-label={`Actions for ${displayTitle}`}>
                <button
                  className="text-button"
                  type="button"
                  disabled={isSaving}
                  aria-label={`Edit ${displayTitle}`}
                  onClick={() => onEdit(todo)}
                >
                  Edit
                </button>
                <button
                  className="text-button delete-button"
                  type="button"
                  disabled={isSaving}
                  aria-label={`Delete ${displayTitle}`}
                  onClick={() => onDelete(todo)}
                >
                  Delete
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default TodoList;
