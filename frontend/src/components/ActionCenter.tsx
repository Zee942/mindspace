import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { Task, Skill, Goal, Node, TaskStatus, Subtask, ActionView } from '../types';
import { styles } from '../styles/styles';
import { EmptyState } from './EmptyState';

const taskStatusColors: Record<TaskStatus, { dot: string }> = {
  'To Do': { dot: '#FFB800' },
  'Done': { dot: '#34C759' },
};

const badgeColors: Record<string, string> = {
  Goal: '#FF9500',
};

// --- TASK CARD ---
const TaskCard: React.FC<{
  task: Task;
  skills: Skill[];
  goals: Goal[];
  onDelete: (taskId: string) => void;
  onAddToMap: (task: Task) => void;
  isOnMap: boolean;
  onSelectTask: (id: string) => void;
  draggingTaskId: string | null;
  setDraggingTaskId: (id: string | null) => void;
}> = ({ task, skills, goals, onDelete, onAddToMap, isOnMap, onSelectTask, draggingTaskId, setDraggingTaskId }) => {
  const [isHovered, setIsHovered] = useState(false);

  const isDragging = draggingTaskId === task.id;

  const linkedSkill = useMemo(() => {
    return skills.find(s => s.id === task.skillId);
  }, [skills, task.skillId]);
  
  const linkedGoal = useMemo(() => {
    return goals.find(g => g.id === task.goalId);
  }, [goals, task.goalId]);
  
  const subtaskProgress = useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter(st => st.completed).length;
    return { completed, total: task.subtasks.length };
  }, [task.subtasks]);

  const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.setData('taskStatus', task.status);
      e.dataTransfer.effectAllowed = 'move';
      setDraggingTaskId(task.id);
  };
  
  const handleDragEnd = () => {
      setDraggingTaskId(null);
  };
  
  return (
    <div 
      style={{ 
        ...styles.taskCard, 
        borderColor: isHovered ? 'var(--border-color)' : 'transparent',
        ...(isDragging ? styles.taskCardDragging : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
        <div style={styles.taskCardContent}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--text-secondary)', flexShrink: 0}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span style={{ paddingRight: '6.5rem' }}>{task.content}</span>
        </div>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center'}}>
          {linkedSkill && (
             <div style={{
                  ...styles.taskCardSkillBadge,
                  backgroundColor: linkedSkill.color ? d3.color(linkedSkill.color)!.copy({opacity: 0.2}).toString() : 'rgba(160, 102, 255, 0.2)',
                  color: linkedSkill.color ? d3.color(linkedSkill.color)!.brighter(1.5).toString() : '#d1b8ff',
              }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"></path></svg>
                  {linkedSkill.title}
              </div>
          )}
          {linkedGoal && (
               <div style={{
                  ...styles.taskCardSkillBadge,
                  backgroundColor: d3.color(badgeColors['Goal'])!.copy({opacity: 0.2}).toString(),
                  color: d3.color(badgeColors['Goal'])!.brighter(1.5).toString(),
              }}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                  {linkedGoal.title}
              </div>
          )}
          {subtaskProgress && (
            <div style={styles.taskCardSubtaskProgress}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>{subtaskProgress.completed} / {subtaskProgress.total}</span>
            </div>
          )}
      </div>
      {isHovered && (
        <div style={styles.taskCardActions}>
          <button 
            style={{ ...styles.taskCardActionButton, ...(isOnMap ? { color: 'var(--secondary-color)' } : {}) }}
            onClick={() => onAddToMap(task)}
            title={isOnMap ? "View on map" : "Add to map"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>
           <button 
            style={{ ...styles.taskCardActionButton }}
            onClick={() => onSelectTask(task.id)}
            title="Edit task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button 
            style={{ ...styles.taskCardActionButton, color: 'var(--danger-color)' }} 
            onClick={() => onDelete(task.id)}
            title="Delete task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      )}
    </div>
  );
};

// --- GOAL CARD ---
const GoalCard: React.FC<{
  goal: Goal;
  linkedTasks: Task[];
  onSelect: (goalId: string) => void;
}> = ({ goal, linkedTasks, onSelect }) => {
    const completedTasks = useMemo(() => linkedTasks.filter(t => t.status === 'Done').length, [linkedTasks]);
    const progress = useMemo(() => linkedTasks.length > 0 ? (completedTasks / linkedTasks.length) * 100 : 0, [completedTasks, linkedTasks]);

    return (
        <div style={styles.goalCard} onClick={() => onSelect(goal.id)}>
            <h3 style={styles.goalCardTitle}>{goal.title}</h3>
            <p style={styles.goalCardSummary}>{goal.summary}</p>
            <div style={styles.progressContainer}>
                 <div style={styles.progressBarLabel}>
                    <label style={styles.label}>Progress</label>
                    <span style={{color: 'var(--secondary-color)', fontWeight: 600, fontSize: '0.9rem'}}>{Math.round(progress)}%</span>
                </div>
                <div style={styles.progressBar}>
                    <div style={{...styles.progressBarFill, width: `${progress}%`}} />
                </div>
            </div>
            <div style={styles.goalCardFooter}>
                <span>{completedTasks} / {linkedTasks.length} Tasks Completed</span>
            </div>
        </div>
    );
};

// --- GOAL MODAL ---
const GoalModal: React.FC<{
  goal: Goal | null;
  tasks: Task[];
  onClose: () => void;
  onSave: (goalData: Omit<Goal, 'id'>, linkedTaskIds: string[]) => void;
  onDelete: (goalId: string) => void;
}> = ({ goal, tasks, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(goal?.title || '');
    const [summary, setSummary] = useState(goal?.summary || '');
    const [linkedTaskIds, setLinkedTaskIds] = useState<Set<string>>(() => {
        const initialIds = tasks.filter(t => t.goalId === goal?.id).map(t => t.id);
        return new Set(initialIds);
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({ title: title.trim(), summary: summary.trim() }, Array.from(linkedTaskIds));
    };
    
    const handleTaskToggle = (taskId: string) => {
        setLinkedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <header style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                        <h1 style={{...styles.h1, fontSize: '2rem'}}>{goal ? 'Edit Goal' : 'Add New Goal'}</h1>
                        <p style={styles.p}>{goal ? 'Update the details for your goal.' : 'Define a new goal to work towards.'}</p>
                    </div>
                    <button onClick={onClose} style={{...styles.navButton, color: 'var(--text-secondary)', background: 'none', border: 'none', backdropFilter: 'none'}} aria-label="Close goal form">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </header>
                <form style={styles.form} onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="goal-title" style={styles.label}>Goal Title</label>
                        <input id="goal-title" type="text" style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
                    </div>
                    <div>
                        <label htmlFor="goal-summary" style={styles.label}>Summary / Description</label>
                        <textarea id="goal-summary" style={styles.textarea} value={summary} onChange={(e) => setSummary(e.target.value)} />
                    </div>
                    <div>
                        <label style={styles.label}>Linked Tasks</label>
                        <ul style={styles.taskListForGoal}>
                            {tasks.length > 0 ? tasks.map(task => (
                                <li key={task.id} style={{...styles.taskListItemForGoal, cursor: 'pointer'}} onClick={() => handleTaskToggle(task.id)}>
                                    <input type="checkbox" readOnly checked={linkedTaskIds.has(task.id)} style={{accentColor: 'var(--primary-color)'}}/>
                                    <span>{task.content}</span>
                                </li>
                            )) : <p style={styles.p}>No tasks available to link.</p>}
                        </ul>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                         {goal && (
                           <button type="button" onClick={() => onDelete(goal.id)} style={{...styles.button, ...styles.dangerButtonLarge, marginRight: 'auto'}}>
                                Delete Goal
                            </button>
                         )}
                        <button type="button" onClick={onClose} style={{ ...styles.button, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', marginLeft: goal ? '0' : 'auto'}}>
                          Cancel
                        </button>
                        <button type="submit" style={{ ...styles.button, ...(!title.trim() ? styles.buttonDisabled : {}) }} disabled={!title.trim()}>
                          {goal ? 'Save Changes' : 'Create Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- TASK DETAIL MODAL ---
const TaskDetailModal: React.FC<{
  task: Task;
  skills: Skill[];
  goals: Goal[];
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onDeleteTask: (taskId: string) => void;
}> = ({ task, skills, goals, onClose, onUpdateTask, onDeleteTask }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [newSubtaskContent, setNewSubtaskContent] = useState('');

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleSubtaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskContent.trim()) return;
    const newSubtask: Subtask = {
      id: `subtask-${Date.now()}`,
      content: newSubtaskContent.trim(),
      completed: false,
    };
    setEditedTask(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask],
    }));
    setNewSubtaskContent('');
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    }));
  };
  
  const handleSubtaskDelete = (subtaskId: string) => {
      setEditedTask(prev => ({
          ...prev,
          subtasks: (prev.subtasks || []).filter(st => st.id !== subtaskId),
      }));
  };

  const handleSave = () => {
    onUpdateTask(task.id, editedTask);
  };
  
  const handleDelete = () => {
      if(window.confirm("Are you sure you want to delete this task?")) {
          onDeleteTask(task.id);
          onClose();
      }
  }

  const subtaskProgress = useMemo(() => {
    if (!editedTask.subtasks || editedTask.subtasks.length === 0) return 0;
    const completed = editedTask.subtasks.filter(st => st.completed).length;
    return (completed / editedTask.subtasks.length) * 100;
  }, [editedTask.subtasks]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <header style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
                <h1 style={{...styles.h1, fontSize: '2rem'}}>Task Details</h1>
            </div>
            <button onClick={onClose} style={{...styles.navButton, color: 'var(--text-secondary)', background: 'none', border: 'none', backdropFilter: 'none'}} aria-label="Close task details">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </header>
        <div style={styles.form}>
            <input
              type="text"
              style={styles.input}
              value={editedTask.content}
              onChange={(e) => setEditedTask(prev => ({ ...prev, content: e.target.value }))}
            />
            <div style={{display: 'flex', gap: '1rem'}}>
                 <select
                    style={{...styles.input, ...styles.select}}
                    value={editedTask.skillId || ''}
                    onChange={(e) => setEditedTask(prev => ({ ...prev, skillId: e.target.value || null }))}
                    aria-label="Link to skill"
                >
                    <option value="" style={styles.selectOption}>— No Skill —</option>
                    {skills.map(skill => (
                        <option key={skill.id} value={skill.id} style={styles.selectOption}>{skill.title}</option>
                    ))}
                </select>
                 <select
                    style={{...styles.input, ...styles.select}}
                    value={editedTask.goalId || ''}
                    onChange={(e) => setEditedTask(prev => ({ ...prev, goalId: e.target.value || null }))}
                    aria-label="Link to goal"
                >
                    <option value="" style={styles.selectOption}>— No Goal —</option>
                    {goals.map(goal => (
                        <option key={goal.id} value={goal.id} style={styles.selectOption}>{goal.title}</option>
                    ))}
                </select>
            </div>

            <div>
                <label style={styles.label}>Subtasks</label>
                {(editedTask.subtasks && editedTask.subtasks.length > 0) && (
                     <div style={{...styles.progressContainer, marginBottom: '1rem'}}>
                         <div style={styles.progressBarLabel}>
                            <label style={{...styles.label, marginBottom: 0}}>Progress</label>
                            <span style={{color: 'var(--secondary-color)', fontWeight: 600, fontSize: '0.9rem'}}>{Math.round(subtaskProgress)}%</span>
                        </div>
                        <div style={styles.progressBar}>
                            <div style={{...styles.progressBarFill, width: `${subtaskProgress}%`}} />
                        </div>
                    </div>
                )}
                <ul style={styles.subtaskList}>
                    {(editedTask.subtasks || []).map(st => (
                        <li key={st.id} style={styles.subtaskItem}>
                            <input type="checkbox" style={styles.subtaskCheckbox} checked={st.completed} onChange={() => handleSubtaskToggle(st.id)} />
                            <span style={{...styles.subtaskContent, textDecoration: st.completed ? 'line-through' : 'none', opacity: st.completed ? 0.6 : 1}}>{st.content}</span>
                            <button style={styles.subtaskDeleteButton} onClick={() => handleSubtaskDelete(st.id)}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </li>
                    ))}
                </ul>
                <form onSubmit={handleSubtaskAdd} style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                    <input type="text" style={{...styles.input, padding: '0.75rem 1rem'}} placeholder="+ Add a subtask" value={newSubtaskContent} onChange={(e) => setNewSubtaskContent(e.target.value)} />
                    <button type="submit" style={{...styles.button, width: 'auto', padding: '0.75rem 1.25rem'}}>+</button>
                </form>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={handleDelete} style={{...styles.button, ...styles.dangerButtonLarge, marginRight: 'auto'}}>Delete Task</button>
                <button type="button" onClick={onClose} style={{ ...styles.button, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)'}}>Cancel</button>
                <button type="button" onClick={handleSave} style={{...styles.button}} >Save Changes</button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN ACTION CENTER COMPONENT ---
export const ActionCenter: React.FC<{
  tasks: Task[];
  skills: Skill[];
  goals: Goal[];
  nodes: Node[];
  onAddTask: (content: string, status: TaskStatus, skillId?: string | null, goalId?: string | null) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTaskToMap: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  draggingTaskId: string | null;
  setDraggingTaskId: (id: string | null) => void;
  setActiveTab: (tab: 'map' | 'dashboard' | 'action') => void;
  onAddGoal: (goalData: Omit<Goal, 'id'>, linkedTaskIds: string[]) => void;
  onUpdateGoal: (goalId: string, goalData: Omit<Goal, 'id'>, linkedTaskIds: string[]) => void;
  onDeleteGoal: (goalId: string) => void;
}> = (props) => {
  const { tasks, skills, goals, nodes, onAddTask, onDeleteTask, onAddTaskToMap, onUpdateTask, onUpdateTaskStatus, draggingTaskId, setDraggingTaskId, setActiveTab, onAddGoal, onUpdateGoal, onDeleteGoal } = props;
  const [actionView, setActionView] = useState<ActionView>('tasks');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskSkillId, setNewTaskSkillId] = useState('');
  const [newTaskGoalId, setNewTaskGoalId] = useState('');
  
  const statuses: TaskStatus[] = ['To Do', 'Done'];

  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);
  const viewingTask = useMemo(() => tasks.find(t => t.id === viewingTaskId), [tasks, viewingTaskId]);
  
  const handleAddNewTask = (e: React.FormEvent, status: TaskStatus) => {
    e.preventDefault();
    if (newTaskContent.trim()) {
      onAddTask(newTaskContent.trim(), status, newTaskSkillId || null, newTaskGoalId || null);
      setNewTaskContent('');
      setNewTaskSkillId('');
      setNewTaskGoalId('');
      setIsAddingTask(null);
    }
  };
  
  const handleSaveGoal = (goalData: Omit<Goal, 'id'>, linkedTaskIds: string[]) => {
      if (selectedGoalId) {
          onUpdateGoal(selectedGoalId, goalData, linkedTaskIds);
      } else {
          onAddGoal(goalData, linkedTaskIds);
      }
      setSelectedGoalId(null);
      setIsAddGoalModalOpen(false);
  };
  
  const handleDeleteGoal = (goalId: string) => {
      if (window.confirm("Are you sure you want to delete this goal? This cannot be undone.")) {
          onDeleteGoal(goalId);
          setSelectedGoalId(null);
          setIsAddGoalModalOpen(false);
      }
  };
  
  const handleTaskDetailSave = (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
      onUpdateTask(taskId, updates);
      setViewingTaskId(null);
  }

  return (
    <>
      <style>{`
        .task-board::-webkit-scrollbar {
          display: none;
        }
        .task-cards-container::-webkit-scrollbar {
          width: 6px;
        }
        .task-cards-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .task-cards-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .task-cards-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <div style={styles.actionCenterContainer}>
       <header style={{...styles.header, marginBottom: '2rem', paddingTop: '0', marginTop: '0'}}>
            <h1 style={{...styles.h1, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary-color)'}}>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m5.2-14.8L13 8.4m-2 7.2-4.2 4.2M1 12h6m6 0h6M4.2 4.2 8.4 8.4m7.2 2 4.2 4.2M1 12h6m6 0h6M4.2 19.8 8.4 15.6m7.2-2 4.2-4.2"></path>
              </svg>
              Action Center
            </h1>
            <p style={styles.p}>Organize, track, and manage your tasks and goals.</p>
        </header>

        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem',
          marginLeft: '0',
        }}>
            <button 
                onClick={() => setActionView('tasks')}
                style={{
                  backgroundColor: actionView === 'tasks' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: actionView === 'tasks' ? '#6366f1' : 'var(--text-secondary)',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  if (actionView !== 'tasks') {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (actionView !== 'tasks') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              Tasks
            </button>
            <button 
                onClick={() => setActionView('goals')}
                style={{
                  backgroundColor: actionView === 'goals' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: actionView === 'goals' ? '#6366f1' : 'var(--text-secondary)',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  if (actionView !== 'goals') {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (actionView !== 'goals') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              Goals
            </button>
        </div>
      
        {actionView === 'tasks' && (
              <div className="task-board" style={styles.taskBoard}>
                {statuses.map(status => {
                  const statusTasks = tasks.filter(task => task.status === status);
                  
                  // Group tasks by goal
                  const tasksByGoal = statusTasks.reduce((acc, task) => {
                    const key = task.goalId || 'no-goal';
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(task);
                    return acc;
                  }, {} as Record<string, Task[]>);
                  
                  // Sort: tasks with goals first (alphabetically by goal title), then ungrouped tasks
                  const sortedGroups = Object.entries(tasksByGoal).sort(([keyA], [keyB]) => {
                    if (keyA === 'no-goal') return 1;
                    if (keyB === 'no-goal') return -1;
                    const goalA = goals.find(g => g.id === keyA);
                    const goalB = goals.find(g => g.id === keyB);
                    return (goalA?.title || '').localeCompare(goalB?.title || '');
                  });
                  
                  return (
                    <div key={status} style={{...styles.taskColumn}}>
                      <div style={styles.taskColumnHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ ...styles.taskColumnDot, backgroundColor: taskStatusColors[status].dot }}></span>
                            <h3 style={styles.taskColumnTitle}>{status}</h3>
                            <span style={styles.taskCount}>{statusTasks.length}</span>
                          </div>
                          {/* Add Task Button on the right side of header */}
                          {isAddingTask !== status && (
                            <button 
                              style={{
                                ...styles.button, 
                                width: 'auto',
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px dashed var(--border-color)',
                                color: 'var(--text-secondary)',
                              }} 
                              onClick={() => setIsAddingTask(status)}
                            >
                              + New Task
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Add Task Form below header */}
                      {isAddingTask === status && (
                        <div style={{marginBottom: '1rem'}}>
                          <form onSubmit={(e) => handleAddNewTask(e, status)} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            padding: '1rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                          }}>
                            <input
                              type="text"
                              style={styles.input}
                              placeholder="Task content"
                              value={newTaskContent}
                              onChange={(e) => setNewTaskContent(e.target.value)}
                              autoFocus
                            />
                            <div style={{display: 'flex', gap: '0.75rem'}}>
                              <select
                                style={{...styles.input, ...styles.select, flex: 1}}
                                value={newTaskSkillId}
                                onChange={(e) => setNewTaskSkillId(e.target.value)}
                              >
                                <option value="" style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>— No Skill —</option>
                                {skills.map(skill => (
                                  <option key={skill.id} value={skill.id} style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>{skill.title}</option>
                                ))}
                              </select>
                              <select
                                style={{...styles.input, ...styles.select, flex: 1}}
                                value={newTaskGoalId}
                                onChange={(e) => setNewTaskGoalId(e.target.value)}
                              >
                                <option value="" style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>— No Goal —</option>
                                {goals.map(goal => (
                                  <option key={goal.id} value={goal.id} style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>{goal.title}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'flex-end'}}>
                              <button 
                                type="button"
                                style={{...styles.button, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', width: 'auto'}}
                                onClick={() => {
                                  setIsAddingTask(null);
                                  setNewTaskContent('');
                                  setNewTaskSkillId('');
                                  setNewTaskGoalId('');
                                }}
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit"
                                style={{...styles.button, width: 'auto', ...((!newTaskContent.trim()) ? styles.buttonDisabled : {})}}
                                disabled={!newTaskContent.trim()}
                              >
                                Add Task
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                      
                      <div 
                        className="task-cards-container" 
                        style={{...styles.taskCardsContainer, gap: '1.5rem'}}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const taskId = e.dataTransfer.getData('taskId');
                          const taskStatus = e.dataTransfer.getData('taskStatus') as TaskStatus;
                          if (taskId && taskStatus !== status) {
                            onUpdateTaskStatus(taskId, status);
                          }
                        }}
                      >
                        {sortedGroups.map(([goalKey, groupTasks]: [string, Task[]]) => {
                          const goal = goalKey !== 'no-goal' ? goals.find(g => g.id === goalKey) : null;
                          
                          return (
                            <div key={goalKey} style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                              {goal && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.5rem 0',
                                  borderBottom: '1px solid rgba(255, 159, 10, 0.2)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="6"></circle>
                                    <circle cx="12" cy="12" r="2"></circle>
                                  </svg>
                                  <span style={{color: '#FF9500'}}>{goal.title}</span>
                                  <span style={{marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: '0.8rem'}}>
                                    {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
                                  </span>
                                </div>
                              )}
                              {groupTasks.map(task => {
                                const isOnMap = nodes.some(node => node.title === task.content);
                                return (
                                  <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    skills={skills}
                                    goals={goals}
                                    onDelete={onDeleteTask}
                                    onAddToMap={onAddTaskToMap}
                                    isOnMap={isOnMap}
                                    onSelectTask={setViewingTaskId}
                                    draggingTaskId={draggingTaskId}
                                    setDraggingTaskId={setDraggingTaskId}
                                  />
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
        )}

        {actionView === 'goals' && (
             <div style={styles.goalsViewContainer}>
                <header style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <p style={{...styles.p, maxWidth: '600px'}}>Define your high-level objectives. Click a goal to edit it and link tasks.</p>
                    {goals.length > 0 &&
                      <button style={{...styles.button, width: 'auto'}} onClick={() => setIsAddGoalModalOpen(true)}>+ New Goal</button>
                    }
                </header>

                 {goals.length === 0 ? (
                    <EmptyState
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>}
                        title="Set Your Sights"
                        message="You haven't defined any goals yet. Create your first goal to start tracking progress towards your ambitions."
                        action={
                            <button style={{...styles.button, width: 'auto'}} onClick={() => setIsAddGoalModalOpen(true)}>
                                + Add First Goal
                            </button>
                        }
                    />
                 ) : (
                    <div style={styles.goalsGrid}>
                        {goals.map(goal => (
                            <GoalCard 
                                key={goal.id}
                                goal={goal}
                                linkedTasks={tasks.filter(t => t.goalId === goal.id)}
                                onSelect={setSelectedGoalId}
                            />
                        ))}
                    </div>
                 )}
            </div>
        )}

        {(selectedGoalId || isAddGoalModalOpen) && (
            <GoalModal
                goal={selectedGoal}
                tasks={tasks}
                onClose={() => { setSelectedGoalId(null); setIsAddGoalModalOpen(false); }}
                onSave={handleSaveGoal}
                onDelete={handleDeleteGoal}
            />
        )}
        {viewingTask && (
            <TaskDetailModal
                task={viewingTask}
                skills={skills}
                goals={goals}
                onClose={() => setViewingTaskId(null)}
                onUpdateTask={handleTaskDetailSave}
                onDeleteTask={onDeleteTask}
            />
        )}
    </div>
    </>
  );
};
