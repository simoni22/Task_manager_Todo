import { useState, useEffect, useCallback, useRef } from 'react';
import { useUndoableReducer, taskReducer } from './hooks/useUndoableReducer';
import TaskList from './components/TaskList';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import LatencyLog from './components/LatencyLog';
import './App.css';

function App() {
  const { state: tasks, dispatch, undo, redo, canUndo, canRedo } = useUndoableReducer(taskReducer, []);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [latencyLogs, setLatencyLogs] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Validation: Check for duplicates
  const isDuplicate = useCallback((title, excludeId = null) => {
    return tasks.some(task => 
      task.title.toLowerCase() === title.toLowerCase() && task.id !== excludeId
    );
  }, [tasks]);

  // Validate task title
  const validateTitle = useCallback((title, excludeId = null) => {
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      return { valid: false, error: 'Task title must be at least 3 characters.' };
    }
    if (isDuplicate(trimmed, excludeId)) {
      return { valid: false, error: 'Task with this title already exists.' };
    }
    return { valid: true, error: '', trimmed };
  }, [isDuplicate]);

  // Add latency log
  const addLatencyLog = useCallback((operation, duration) => {
    const log = { operation, duration: duration.toFixed(2), timestamp: Date.now() };
    setLatencyLogs(prev => [log, ...prev].slice(0, 5));
  }, []);

  // Sorting: Pinned first, then by createdAt
  const sortTasks = useCallback((tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      // First by pinned status
      if (a.pinned !== b.pinned) return b.pinned - a.pinned;
      // Then by createdAt
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }, []);

  // Filter and search logic
  const getFilteredTasks = useCallback(() => {
    let filtered = tasks;

    // Apply filter tab
    if (filter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
    }

    // Sort - simplified
    const sorted = [...filtered].sort((a, b) => {
      // First by pinned status
      if (a.pinned !== b.pinned) return b.pinned - a.pinned;
      // Then by createdAt
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    return sorted;
  }, [tasks, filter, searchQuery]);

  const filteredTasks = getFilteredTasks();

  // Add task
  const handleAddTask = useCallback((e) => {
    e.preventDefault();
    const validation = validateTitle(newTaskTitle);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: crypto.randomUUID(),
        title: validation.trimmed
      }
    });

    setNewTaskTitle('');
    setError('');
  }, [newTaskTitle, validateTitle, dispatch]);

  // Toggle task completion
  const handleToggleTask = useCallback((id) => {
    const start = performance.now();
    dispatch({ type: 'TOGGLE_TASK', payload: { id } });
    const duration = performance.now() - start;
    addLatencyLog('Toggle', duration);
  }, [dispatch, addLatencyLog]);

  // Delete task
  const handleDeleteTask = useCallback((id) => {
    dispatch({ type: 'DELETE_TASK', payload: { id } });
  }, [dispatch]);

  // Edit task
  const handleEditTask = useCallback((id, newTitle) => {
    const validation = validateTitle(newTitle, id);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    dispatch({
      type: 'EDIT_TASK',
      payload: { id, title: validation.trimmed }
    });

    return { success: true };
  }, [validateTitle, dispatch]);

  // Toggle pin
  const handleTogglePin = useCallback((id) => {
    const start = performance.now();
    dispatch({ type: 'TOGGLE_PIN', payload: { id } });
    const duration = performance.now() - start;
    addLatencyLog('Pin', duration);
  }, [dispatch, addLatencyLog]);

  // Change filter and clear search
  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setSearchQuery('');
    setSelectedIndex(-1);
  }, []);

  // Export tasks
  const handleExport = useCallback(() => {
    const data = {
      version: 1,
      tasks: tasks.map(({ id, title, completed, pinned, createdAt }) => ({
        id, title, completed, pinned, createdAt
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks]);

  // Import tasks
  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (!data.tasks || !Array.isArray(data.tasks)) {
          console.error('Invalid JSON schema');
          return;
        }

        const validTasks = [];
        const seenIds = new Set();
        const seenTitles = new Set();
        let skippedCount = 0;

        for (const task of data.tasks) {
          // Validate required fields
          if (!task.id || !task.title || typeof task.completed !== 'boolean') {
            skippedCount++;
            continue;
          }

          // Deduplicate by ID
          if (seenIds.has(task.id)) {
            skippedCount++;
            continue;
          }

          // Deduplicate by title (case-insensitive)
          const lowerTitle = task.title.toLowerCase();
          if (seenTitles.has(lowerTitle)) {
            skippedCount++;
            continue;
          }

          // Time travel check
          let createdAt = task.createdAt;
          if (!createdAt || new Date(createdAt) > new Date()) {
            createdAt = new Date().toISOString();
          }

          validTasks.push({
            id: task.id,
            title: task.title,
            completed: task.completed,
            pinned: task.pinned || false,
            createdAt
          });

          seenIds.add(task.id);
          seenTitles.add(lowerTitle);
        }

        if (skippedCount > 0) {
          console.log(`Skipped ${skippedCount} tasks (duplicates or invalid)`);
        }

        dispatch({ type: 'IMPORT_TASKS', payload: { tasks: validTasks } });
        setError('');
      } catch (err) {
        console.error('Failed to parse JSON:', err);
      }
    };
    
    reader.readAsText(file);
    e.target.value = '';
  }, [dispatch]);

  // Seed 1000 tasks
  const handleSeed = useCallback(() => {
    setIsSeeding(true);
    setError('');
    
    // Use setTimeout to allow UI to update before heavy operation
    setTimeout(() => {
      try {
        const count = 1000;
        const seedTasks = [];
        const now = Date.now();
        const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
        
        // Fallback ID generator
        const generateId = (index) => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return `task-${now}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        };
        
        for (let i = 0; i < count; i++) {
          seedTasks.push({
            id: generateId(i),
            title: `Task ${i + 1} - ${(i * 12345).toString(36)}`,
            completed: i % 5 === 0,
            pinned: i % 100 === 0,
            createdAt: new Date(now - (i * tenDaysMs / count)).toISOString()
          });
        }
        
        console.log(`Generated ${count} tasks`);
        dispatch({ type: 'SEED_TASKS', payload: { tasks: seedTasks } });
        setIsSeeding(false);
      } catch (error) {
        console.error('Seed failed:', error);
        setError('Failed to generate tasks: ' + error.message);
        setIsSeeding(false);
      }
    }, 100);
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (canUndo) undo();
        return;
      }
      
      // Ctrl+Shift+Z or Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        e.stopPropagation();
        if (canRedo) redo();
        return;
      }

      // /: Focus search (not when in input or textarea)
      const activeTag = document.activeElement?.tagName;
      if (e.key === '/' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Esc: Clear search and blur
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.blur();
        return;
      }

      // Arrow keys: Navigate tasks (not in inputs)
      if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredTasks.length - 1));
          return;
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          return;
        }

        // Space: Toggle selected task
        if (e.key === ' ' && selectedIndex >= 0) {
          e.preventDefault();
          handleToggleTask(filteredTasks[selectedIndex].id);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [canUndo, canRedo, undo, redo, filteredTasks, selectedIndex, handleToggleTask]);

  // Reset selected index when filtered tasks change
  useEffect(() => {
    if (selectedIndex >= filteredTasks.length) {
      setSelectedIndex(filteredTasks.length - 1);
    }
  }, [filteredTasks, selectedIndex]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo++ Pro</h1>
        <div className="actions">
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">↶ Undo</button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">↷ Redo</button>
          <button onClick={handleExport}>Export JSON</button>
          <button onClick={() => fileInputRef.current?.click()}>Import JSON</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button onClick={handleSeed} disabled={isSeeding}>
            {isSeeding ? 'Loading...' : 'Seed 1000'}
          </button>
        </div>
      </header>

      <form onSubmit={handleAddTask} className="add-task-form">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => {
            setNewTaskTitle(e.target.value);
            if (error) setError('');
          }}
          placeholder="Add a new task (min 3 chars)..."
          aria-label="New task title"
          className={error ? 'error' : ''}
        />
        <button type="submit">Add Task</button>
      </form>
      
      {error && <div className="error-message" role="alert">{error}</div>}

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
      />

      <FilterTabs filter={filter} onFilterChange={handleFilterChange} />

      <div className="stats">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      <TaskList
        tasks={filteredTasks}
        selectedIndex={selectedIndex}
        onToggle={handleToggleTask}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
        onTogglePin={handleTogglePin}
      />

      <LatencyLog logs={latencyLogs} />

      <footer className="app-footer">
        <kbd>/</kbd> Focus search · <kbd>↑↓</kbd> Navigate · <kbd>Space</kbd> Toggle · 
        <kbd>Esc</kbd> Clear · <kbd>Ctrl+Z</kbd> Undo · <kbd>Ctrl+Shift+Z</kbd> Redo
      </footer>
    </div>
  );
}

export default App;
