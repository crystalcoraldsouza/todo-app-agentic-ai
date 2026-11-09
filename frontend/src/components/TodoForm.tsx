import type { SubmitEvent } from 'react';

export interface TodoFormValues {
  title: string;
  description: string;
  dueDateTime: string;
}

interface TodoFormProps {
  values: TodoFormValues;
  error: string;
  errorField: keyof TodoFormValues | null;
  isEditing: boolean;
  isSaving: boolean;
  isValid: boolean;
  minimumDueDateTime: string;
  onChange: (field: keyof TodoFormValues, value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

function TodoForm({
  values,
  error,
  errorField,
  isEditing,
  isSaving,
  isValid,
  minimumDueDateTime,
  onChange,
  onSubmit,
  onCancel,
}: TodoFormProps) {
  return (
    <section className="form-section" aria-labelledby="form-heading">
      <h2 id="form-heading">{isEditing ? 'Edit ToDo' : 'Add a ToDo'}</h2>
      <form onSubmit={onSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="todo-title">Title <span aria-hidden="true">*</span></label>
          <input
            autoComplete="off"
            id="todo-title"
            name="title"
            required
            type="text"
            value={values.title}
            disabled={isSaving}
            onChange={(event) => onChange('title', event.target.value)}
            aria-invalid={errorField === 'title'}
            aria-describedby={error ? 'form-error' : undefined}
          />
        </div>

        <div className="form-field">
          <label htmlFor="todo-description">
            Description <span className="optional-label">(optional)</span>
          </label>
          <textarea
            id="todo-description"
            name="description"
            rows={3}
            value={values.description}
            disabled={isSaving}
            onChange={(event) => onChange('description', event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="todo-due-date">
            Due date and time <span className="optional-label">(optional)</span>
          </label>
          <input
            id="todo-due-date"
            min={minimumDueDateTime}
            name="dueDateTime"
            type="datetime-local"
            value={values.dueDateTime}
            disabled={isSaving}
            onChange={(event) => onChange('dueDateTime', event.target.value)}
            aria-invalid={errorField === 'dueDateTime'}
            aria-describedby={errorField === 'dueDateTime' ? 'form-error' : undefined}
          />
          <p className="field-hint">Shown in your local time.</p>
        </div>

        {error && <p className="form-error" id="form-error" role="alert">{error}</p>}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSaving || !isValid || Boolean(error)}>
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add ToDo'}
          </button>
          {isEditing && (
            <button className="secondary-button" type="button" disabled={isSaving} onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default TodoForm;
