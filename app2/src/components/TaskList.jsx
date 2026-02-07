import TaskItem from './TaskItem';
import { useState } from 'react';

function TaskList({ tasks, selectedIndex, onToggle, onDelete, onEdit, onTogglePin }) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 100;
  const shouldLimit = tasks.length > displayLimit && !showAll;
  const displayTasks = shouldLimit ? tasks.slice(0, displayLimit) : tasks;

  if (tasks.length === 0) {
    return <div className="empty-state">No tasks found. Add one above!</div>;
  }

  return (
    <div className="task-list" role="list">
      {displayTasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          isSelected={index === selectedIndex}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
        />
      ))}
      {shouldLimit && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => setShowAll(true)}
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Show All {tasks.length} Tasks (showing {displayLimit})
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskList;
