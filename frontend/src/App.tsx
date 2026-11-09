import { useEffect, useState, type SubmitEvent } from 'react';
import TodoForm, { type TodoFormValues } from './components/TodoForm.js';
import TodoList from './components/TodoList.js';
import {
  createTodo as createTodoRequest,
  deleteTodo as deleteTodoRequest,
  getTodos,
  updateTodo as updateTodoRequest,
  TodoApiError,
  type Todo,
  type TodoInput,
} from './todoService.js';
import {
  getMinimumDueDateTime,
  isPastDueDateTime,
  toLocalDateTimeInput,
  toUtcDateTime,
} from './todoDateTime.js';

const EMPTY_FORM: TodoFormValues = { title: '', description: '', dueDateTime: '' };

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [formError, setFormError] = useState('');
  const [formErrorField, setFormErrorField] = useState<keyof TodoFormValues | null>(null);
  const [actionError, setActionError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [minimumDueDateTime, setMinimumDueDateTime] = useState(getMinimumDueDateTime);

  const completedCount = todos.filter((todo) => todo.isCompleted).length;

  useEffect(() => {
    const controller = new AbortController();

    async function loadTodos(): Promise<void> {
      setIsLoading(true);
      setLoadError('');

      try {
        setTodos(await getTodos(controller.signal));
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadTodos();
    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMinimumDueDateTime(getMinimumDueDateTime());
    }, 10_000);

    return () => window.clearInterval(timer);
  }, []);

  function resetForm(): void {
    setFormValues(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setFormErrorField(null);
  }

  function refreshAfterNotFound(error: unknown): void {
    if (error instanceof TodoApiError && error.code === 'TODO_NOT_FOUND') {
      setLoadAttempt((attempt) => attempt + 1);
    }
  }

  function handleFormChange(field: keyof TodoFormValues, value: string): void {
    if (field === 'dueDateTime' && value && isPastDueDateTime(value)) {
      setFormValues((currentValues) => ({ ...currentValues }));
      setFormError('Please choose a future due date and time.');
      setFormErrorField('dueDateTime');
      return;
    }

    setFormValues((currentValues) => ({ ...currentValues, [field]: value }));

    if (field === 'title' && value.trim().length === 0) {
      setFormError('Please enter a title for your ToDo.');
      setFormErrorField('title');
      return;
    }

    if (formErrorField === field || formErrorField === null) {
      setFormError('');
      setFormErrorField(null);
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setActionError('');
    setStatusMessage('');

    const todoInput: TodoInput = {
      title: formValues.title,
      description: formValues.description.trim() ? formValues.description : null,
      dueDateTime: toUtcDateTime(formValues.dueDateTime),
    };

    setIsSaving(true);

    try {
      const savedTodo = editingId
        ? await updateTodoRequest(editingId, todoInput)
        : await createTodoRequest(todoInput);

      if (editingId) {
        setTodos((currentTodos) => currentTodos.map((todo) =>
          todo.id === editingId ? savedTodo : todo,
        ));
        setStatusMessage('ToDo updated.');
      } else {
        setTodos((currentTodos) => [...currentTodos, savedTodo]
          .sort((firstTodo, secondTodo) => firstTodo.ordinal - secondTodo.ordinal));
        setStatusMessage('ToDo added.');
      }

      resetForm();
    } catch (error) {
      refreshAfterNotFound(error);
      setFormError(getErrorMessage(error));
      setFormErrorField(null);
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(todo: Todo): void {
    setFormValues({
      title: todo.title,
      description: todo.description ?? '',
      dueDateTime: toLocalDateTimeInput(todo.dueDateTime),
    });
    setEditingId(todo.id);
    setFormError('');
    setFormErrorField(null);
    setStatusMessage('Editing ToDo.');
    document.getElementById('todo-title')?.focus();
  }

  async function toggleCompleted(todo: Todo): Promise<void> {
    setActionError('');
    setStatusMessage('');
    setIsSaving(true);

    try {
      const updatedTodo = await updateTodoRequest(todo.id, {
        isCompleted: !todo.isCompleted,
      });

      setTodos((currentTodos) => currentTodos.map((currentTodo) =>
        currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
      ));
      setStatusMessage(updatedTodo.isCompleted ? 'ToDo completed.' : 'ToDo reopened.');
    } catch (error) {
      refreshAfterNotFound(error);
      setActionError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTodo(todo: Todo): Promise<void> {
    if (!window.confirm(`Delete “${todo.title}”? This cannot be undone.`)) {
      return;
    }

    setActionError('');
    setStatusMessage('');
    setIsSaving(true);

    try {
      await deleteTodoRequest(todo.id);
      setTodos((currentTodos) => currentTodos.filter((currentTodo) => currentTodo.id !== todo.id));

      if (editingId === todo.id) {
        resetForm();
      }

      setStatusMessage('ToDo deleted.');
    } catch (error) {
      refreshAfterNotFound(error);
      window.alert(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell" aria-busy={isLoading || isSaving}>
      <header className="page-header">
        <p className="eyebrow">Your personal list</p>
        <h1>ToDo</h1>
        <p className="page-intro">A clear space to keep track of what matters.</p>
      </header>

      <TodoList
        todos={todos}
        showCompleted={showCompleted}
        completedCount={completedCount}
        isLoading={isLoading}
        isSaving={isSaving}
        loadError={loadError}
        actionError={actionError}
        onShowCompletedChange={setShowCompleted}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
        onToggleCompleted={(todo) => void toggleCompleted(todo)}
        onEdit={startEditing}
        onDelete={(todo) => void deleteTodo(todo)}
      />

      <TodoForm
        values={formValues}
        error={formError}
        errorField={formErrorField}
        isEditing={editingId !== null}
        isSaving={isSaving}
        isValid={formValues.title.trim().length > 0 &&
          (!formValues.dueDateTime || !isPastDueDateTime(formValues.dueDateTime))}
        minimumDueDateTime={minimumDueDateTime}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />

      <p className="visually-hidden" role="status" aria-live="polite">{statusMessage}</p>
    </main>
  );
}

export default App;
