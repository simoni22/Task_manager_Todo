import { useReducer, useCallback } from 'react';

const MAX_HISTORY = 10;

function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK': {
      const newTask = {
        id: action.payload.id,
        title: action.payload.title,
        completed: false,
        pinned: false,
        createdAt: new Date().toISOString()
      };
      return [...state, newTask];
    }
    
    case 'DELETE_TASK':
      return state.filter(task => task.id !== action.payload.id);
    
    case 'EDIT_TASK':
      return state.map(task =>
        task.id === action.payload.id
          ? { ...task, title: action.payload.title }
          : task
      );
    
    case 'TOGGLE_TASK':
      return state.map(task =>
        task.id === action.payload.id
          ? { ...task, completed: !task.completed }
          : task
      );
    
    case 'TOGGLE_PIN':
      return state.map(task =>
        task.id === action.payload.id
          ? { ...task, pinned: !task.pinned }
          : task
      );
    
    case 'IMPORT_TASKS':
      return action.payload.tasks;
    
    case 'SEED_TASKS':
      return action.payload.tasks;
    
    default:
      return state;
  }
}

export function useUndoableReducer(reducer, initialState) {
  const [history, setHistory] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'PERFORM_ACTION': {
          const newPresent = reducer(state.present, action.payload);
          const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
          return {
            past: newPast,
            present: newPresent,
            future: []
          };
        }
        
        case 'UNDO': {
          if (state.past.length === 0) return state;
          const previous = state.past[state.past.length - 1];
          const newPast = state.past.slice(0, -1);
          return {
            past: newPast,
            present: previous,
            future: [state.present, ...state.future]
          };
        }
        
        case 'REDO': {
          if (state.future.length === 0) return state;
          const next = state.future[0];
          const newFuture = state.future.slice(1);
          return {
            past: [...state.past, state.present],
            present: next,
            future: newFuture
          };
        }
        
        default:
          return state;
      }
    },
    {
      past: [],
      present: initialState,
      future: []
    }
  );

  const dispatch = useCallback((action) => {
    setHistory({ type: 'PERFORM_ACTION', payload: action });
  }, []);

  const undo = useCallback(() => {
    setHistory({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    setHistory({ type: 'REDO' });
  }, []);

  return {
    state: history.present,
    dispatch,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}

export { taskReducer };
