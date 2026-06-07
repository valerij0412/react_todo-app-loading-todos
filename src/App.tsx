/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  USER_ID,
  getTodos,
  addTodo,
  deleteTodo,
  updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterBy, setFilterBy] = useState('All');
  const [title, setTitle] = useState('');
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  // Стани для редагування
  const [editedTodo, setEditedTodo] = useState<Todo | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Title should not be empty');
      setTimeout(() => setErrorMessage(''), 3000);

      return;
    }

    const newTodo = {
      title: title.trim(),
      userId: USER_ID,
      completed: false,
    };

    addTodo(newTodo)
      .then(createdTodo => {
        setTodos(currentTodos => [...currentTodos, createdTodo]);
        setTitle('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  };

  const handleDelete = (todoId: number) => {
    setErrorMessage('');
    setProcessingIds(current => [...current, todoId]);

    // prettier-ignore
    deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId)
        );
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setProcessingIds(current => current.filter(id => id !== todoId));
      });
  };

  const handleToggle = (todoToUpdate: Todo) => {
    setErrorMessage('');
    setProcessingIds(current => [...current, todoToUpdate.id]);

    updateTodo(todoToUpdate.id, { completed: !todoToUpdate.completed })
      .then(updatedTodo => {
        setTodos(currentTodos =>
          currentTodos.map(todo =>
            todo.id === todoToUpdate.id ? updatedTodo : todo,
          ),
        );
      })
      .catch(() => {
        setErrorMessage('Unable to update a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setProcessingIds(current =>
          current.filter(id => id !== todoToUpdate.id),
        );
      });
  };

  const handleClearCompleted = () => {
    setErrorMessage('');
    const completedTodos = todos.filter(todo => todo.completed);
    const completedIds = completedTodos.map(todo => todo.id);

    setProcessingIds(current => [...current, ...completedIds]);

    const deletePromises = completedTodos.map(todo =>
      deleteTodo(todo.id).then(() => {
        setTodos(current => current.filter(t => t.id !== todo.id));
      }),
    );

    Promise.all(deletePromises)
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setProcessingIds(current =>
          current.filter(id => !completedIds.includes(id)),
        );
      });
  };

  const handleEdit = (todo: Todo) => {
    setEditedTodo(todo);
    setTempTitle(todo.title);
  };

  const saveTitle = (todo: Todo) => {
    if (tempTitle === todo.title) {
      setEditedTodo(null);

      return;
    }

    if (!tempTitle.trim()) {
      handleDelete(todo.id);
      setEditedTodo(null);

      return;
    }

    setProcessingIds(current => [...current, todo.id]);

    updateTodo(todo.id, { title: tempTitle.trim() })
      .then(updatedTodo => {
        setTodos(currentTodos =>
          currentTodos.map(t => (t.id === todo.id ? updatedTodo : t)),
        );
        setEditedTodo(null);
      })
      .catch(() => {
        setErrorMessage('Unable to update a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setProcessingIds(current => current.filter(id => id !== todo.id));
      });
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  const visibleTodos = todos.filter(todo => {
    switch (filterBy) {
      case 'Active':
        return !todo.completed;
      case 'Completed':
        return todo.completed;
      case 'All':
      default:
        return true;
    }
  });

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </form>
        </header>

        {todos.length > 0 && (
          <>
            <section className="todoapp__main" data-cy="TodoList">
              {visibleTodos.map(todo => (
                <div
                  data-cy="Todo"
                  className={`todo ${todo.completed ? 'completed' : ''}`}
                  key={todo.id}
                >
                  <label className="todo__status-label">
                    <input
                      data-cy="TodoStatus"
                      type="checkbox"
                      className="todo__status"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo)}
                    />
                  </label>

                  {editedTodo?.id === todo.id ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        saveTitle(todo);
                      }}
                    >
                      <input
                        data-cy="TodoTitleField"
                        type="text"
                        className="todo__title-field"
                        value={tempTitle}
                        onChange={e => setTempTitle(e.target.value)}
                        onBlur={() => saveTitle(todo)}
                        autoFocus
                      />
                    </form>
                  ) : (
                    <span
                      data-cy="TodoTitle"
                      className="todo__title"
                      onDoubleClick={() => handleEdit(todo)}
                    >
                      {todo.title}
                    </span>
                  )}

                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => handleDelete(todo.id)}
                  >
                    ×
                  </button>

                  <div
                    data-cy="TodoLoader"
                    className={`modal overlay ${
                      processingIds.includes(todo.id) ? 'is-active' : ''
                    }`}
                  >
                    {/* eslint-disable-next-line max-len */}
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              ))}
            </section>

            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {todos.filter(todo => !todo.completed).length} items left
              </span>

              <nav className="filter" data-cy="Filter">
                <a
                  href="#/"
                  className={`filter__link ${filterBy === 'All' ? 'selected' : ''}`}
                  data-cy="FilterLinkAll"
                  onClick={() => setFilterBy('All')}
                >
                  All
                </a>
                <a
                  href="#/active"
                  className={`filter__link ${filterBy === 'Active' ? 'selected' : ''}`}
                  data-cy="FilterLinkActive"
                  onClick={() => setFilterBy('Active')}
                >
                  Active
                </a>
                <a
                  href="#/completed"
                  className={`filter__link ${filterBy === 'Completed' ? 'selected' : ''}`}
                  data-cy="FilterLinkCompleted"
                  onClick={() => setFilterBy('Completed')}
                >
                  Completed
                </a>
              </nav>

              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                disabled={todos.filter(todo => todo.completed).length === 0}
                onClick={handleClearCompleted}
              >
                Clear completed
              </button>
            </footer>
          </>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${
          !errorMessage ? 'hidden' : ''
        }`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
