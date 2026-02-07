import { useState, useRef, useEffect, memo } from 'react';

function TaskItem({ task, isSelected, onToggle, onDelete, onEdit, onTogglePin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [editError, setEditError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(task.title);
    setEditError('');
  };

  const handleSave = () => {
    const result = onEdit(task.id, editValue);
    
    if (result.success) {
      setIsEditing(false);
      setEditError('');
    } else {
      setEditError(result.error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(task.title);
    setEditError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`task-item ${isSelected ? 'selected' : ''} ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      
      {isEditing ? (
        <div className="edit-container">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              if (editError) setEditError('');
            }}
            onKeyDown={handleKeyDown}
            className={editError ? 'error' : ''}
            aria-label="Edit task title"
          />
          {editError && <div className="inline-error">{editError}</div>}
          <div className="edit-actions">
            <button onClick={handleSave} className="save-btn">Save</button>
            <button onClick={handleCancel} className="cancel-btn">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <span className="task-title" onClick={handleEdit} title="Click to edit">
            {task.pinned && <span className="pin-icon">📌</span>}
            {task.title}
          </span>
          <div className="task-actions">
            <button
              onClick={() => onTogglePin(task.id)}
              className="pin-btn"
              title={task.pinned ? 'Unpin' : 'Pin'}
              aria-label={task.pinned ? 'Unpin task' : 'Pin task'}
            >
              {task.pinned ? '📌' : '📍'}
            </button>
            <button
              onClick={handleEdit}
              className="edit-btn"
              aria-label="Edit task"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="delete-btn"
              aria-label="Delete task"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(TaskItem);
