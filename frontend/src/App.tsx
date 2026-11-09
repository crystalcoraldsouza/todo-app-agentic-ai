import { useState, type SubmitEvent } from 'react';

interface Todo {
  id: string;
  title: string;
  description: string;
  dueDateTime: string;
  isCompleted: boolean;
}

const EMPTY_FORM = { title: '', description: '', dueDateTime: '' };

function formatDueDate(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getMinimumDueDateTime(): string {
  const nextMinute = new Date();
  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);

  return new Date(nextMinute.getTime() - nextMinute.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const visibleTodos = todos.filter((todo) => showCompleted || !todo.isCompleted);
  const completedCount = todos.filter((todo) => todo.isCompleted).length;
  const minimumDueDateTime = getMinimumDueDateTime();

  function resetForm(): void {
    setFormValues(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (formValues.title.trim().length === 0) {
      setFormError('Please enter a title for your ToDo.');
      setStatusMessage('');
      return;
    }

    if (formValues.dueDateTime && new Date(formValues.dueDateTime).getTime() < Date.now()) {
      setFormError('Please choose a future due date and time.');
      setStatusMessage('');
      return;
    }

    const todoValues = {
      title: formValues.title,
      description: formValues.description.trim() ? formValues.description : '',
      dueDateTime: formValues.dueDateTime,
    };

    if (editingId) {
      setTodos((currentTodos) => currentTodos.map((todo) =>
        todo.id === editingId ? { ...todo, ...todoValues } : todo,
      ));
      setStatusMessage('ToDo updated.');
    } else {
      setTodos((currentTodos) => [
        ...currentTodos,
        { id: crypto.randomUUID(), ...todoValues, isCompleted: false },
      ]);
      setStatusMessage('ToDo added.');
    }

    resetForm();
  }

  function startEditing(todo: Todo): void {
    setFormValues({
      title: todo.title,
      description: todo.description,
      dueDateTime: todo.dueDateTime,
    });
    setEditingId(todo.id);
    setFormError('');
    setStatusMessage('Editing ToDo.');
    document.getElementById('todo-title')?.focus();
  }

  function toggleCompleted(todoId: string): void {
    setTodos((currentTodos) => currentTodos.map((todo) =>
      todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo,
    ));
    setStatusMessage('ToDo completion updated.');
  }

  function deleteTodo(todoId: string): void {
    const todo = todos.find((item) => item.id === todoId);

    if (!todo || !window.confirm(`Delete “${todo.title}”? This cannot be undone.`)) {
      return;
    }

    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== todoId));

    if (editingId === todoId) {
      resetForm();
    }

    setStatusMessage('ToDo deleted.');
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">Your personal list</p>
        <h1>ToDo</h1>
        <p className="page-intro">A clear space to keep track of what matters.</p>
      </header>

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
              onChange={(event) => setShowCompleted(event.target.checked)}
            />
            <span>Show completed ({completedCount})</span>
          </label>
        </div>

        {visibleTodos.length === 0 ? (
          <p className="empty-state">
            {todos.length > 0
              ? 'All done. Show completed ToDos to see them here.'
              : 'Add your first ToDo using the form.'}
          </p>
        ) : (
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <li className={`todo-card${todo.isCompleted ? ' is-completed' : ''}`} key={todo.id}>
                <div className="todo-main">
                  <label className="completion-control">
                    <input
                      type="checkbox"
                      checked={todo.isCompleted}
                      onChange={() => toggleCompleted(todo.id)}
                    />
                    <span className="visually-hidden">
                      Mark “{todo.title}” as {todo.isCompleted ? 'incomplete' : 'complete'}
                    </span>
                  </label>
                  <div className="todo-copy">
                    <h3>{todo.title}</h3>
                    {todo.description && <p>{todo.description}</p>}
                    {todo.dueDateTime && (
                      <p className="due-date">Due {formatDueDate(todo.dueDateTime)}</p>
                    )}
                  </div>
                </div>
                <div className="todo-actions" role="group" aria-label={`Actions for ${todo.title}`}>
                  <button className="text-button" type="button" aria-label={`Edit ${todo.title}`} onClick={() => startEditing(todo)}>
                    Edit
                  </button>
                  <button className="text-button delete-button" type="button" aria-label={`Delete ${todo.title}`} onClick={() => deleteTodo(todo.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="form-section" aria-labelledby="form-heading">
        <h2 id="form-heading">{editingId ? 'Edit ToDo' : 'Add a ToDo'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="todo-title">Title <span aria-hidden="true">*</span></label>
            <input
              autoComplete="off"
              id="todo-title"
              name="title"
              required
              type="text"
              value={formValues.title}
              onChange={(event) => setFormValues({ ...formValues, title: event.target.value })}
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? 'form-error' : undefined}
            />
          </div>

          <div className="form-field">
            <label htmlFor="todo-description">Description <span className="optional-label">(optional)</span></label>
            <textarea
              id="todo-description"
              name="description"
              rows={3}
              value={formValues.description}
              onChange={(event) => setFormValues({ ...formValues, description: event.target.value })}
            />
          </div>

          <div className="form-field">
            <label htmlFor="todo-due-date">Due date and time <span className="optional-label">(optional)</span></label>
            <input
              id="todo-due-date"
              min={minimumDueDateTime}
              name="dueDateTime"
              type="datetime-local"
              value={formValues.dueDateTime}
              onChange={(event) => setFormValues({ ...formValues, dueDateTime: event.target.value })}
            />
            <p className="field-hint">Shown in your local time.</p>
          </div>

          {formError && <p className="form-error" id="form-error" role="alert">{formError}</p>}

          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingId ? 'Save changes' : 'Add ToDo'}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <p className="visually-hidden" role="status" aria-live="polite">{statusMessage}</p>
    </main>
  );
}

export default App;
