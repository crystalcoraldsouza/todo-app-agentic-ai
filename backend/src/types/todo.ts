export interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDateTime: string | null;
  ordinal: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description: string | null;
  dueDateTime: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  dueDateTime?: string | null;
  isCompleted?: boolean;
}
