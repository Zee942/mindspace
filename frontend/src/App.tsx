import React, { useState, useEffect, useCallback } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { Dashboard } from './components/Dashboard';
import { NodeDetailModal } from './components/NodeDetailModal';
import { ActionCenter } from './components/ActionCenter';
import { SkillsView } from './components/SkillsView';
import { FinanceView } from './components/FinanceView';
import { LinkWeaverView } from './components/LinkWeaverView';
import { JournalView } from './components/JournalView';
import { EmptyState } from './components/EmptyState';
import {
  Node, GraphLink, Task, Skill, Goal, Card, IncomeEntry, ExpenseEntry, InvestmentEntry,
  NodeType, TaskStatus, ConnectMode, Tooltip, ActiveTab
} from './types';
import { styles, badgeColors } from './styles/styles';
import { getLinkId } from './utils/helpers';
import * as api from './services/api';

const App = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip>({ content: '', x: 0, y: 0, visible: false });
  const [connectMode, setConnectMode] = useState<ConnectMode>({ active: false, source: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data states
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [investments, setInvestments] = useState<InvestmentEntry[]>([]);

  // --- LOAD DATA FROM BACKEND ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Starting to load data from API...');
        const [
          nodesData,
          linksData,
          tasksData,
          skillsData,
          goalsData,
          cardsData,
          incomeData,
          expensesData,
          investmentsData
        ] = await Promise.all([
          api.getNodes(),
          api.getLinks(),
          api.getTasks(),
          api.getSkills(),
          api.getGoals(),
          api.getCards(),
          api.getIncome(),
          api.getExpenses(),
          api.getInvestments()
        ]);

        console.log('Data loaded successfully:', {
          nodes: nodesData.length,
          links: linksData.length,
          tasks: tasksData.length
        });

        setNodes(nodesData);
        setLinks(linksData);
        setTasks(tasksData);
        setSkills(skillsData);
        setGoals(goalsData);
        setCards(cardsData);
        setIncome(incomeData);
        setExpenses(expensesData);
        setInvestments(investmentsData);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        alert('Failed to connect to the backend. Make sure the server is running on http://localhost:8000');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- HANDLER FUNCTIONS ---

  const handleManualAdd = async (url: string, title: string, summary: string, type: NodeType) => {
    try {
      const newNode = await api.createNode({ title, summary, type, url, x: window.innerWidth / 2, y: window.innerHeight / 3 });
      setNodes(prev => [...prev, newNode]);
      setActiveTab('map');
      setTimeout(() => setSelectedNodeId(newNode.id), 100);
    } catch (error) {
      console.error('Error creating node:', error);
    }
  };

  const handleAddLinkNode = async (title: string, summary: string, url: string) => {
    try {
      const newNode = await api.createNode({
        title,
        summary,
        type: 'Link',
        url,
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 200) + 100
      });
      setNodes(prev => [...prev, newNode]);
    } catch (error) {
      console.error('Error creating link node:', error);
    }
  };

  const handleUpdateNode = async (updatedNode: Node) => {
    try {
      await api.updateNode(updatedNode.id, updatedNode);
      setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await api.deleteNode(nodeId);
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      // Delete associated links
      const nodeLinks = links.filter(l => getLinkId(l.source) === nodeId || getLinkId(l.target) === nodeId);
      for (const link of nodeLinks) {
        if (link.id) {
          await api.deleteLink(link.id);
        }
      }
      setLinks(prev => prev.filter(l => getLinkId(l.source) !== nodeId && getLinkId(l.target) !== nodeId));
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const handleNodeClickConnect = async (targetId: string) => {
    if (!connectMode.active || !connectMode.source || !targetId || connectMode.source === targetId) {
      setConnectMode({ active: false, source: null });
      return;
    }

    const linkExists = links.some(l =>
      (getLinkId(l.source) === connectMode.source && getLinkId(l.target) === targetId) ||
      (getLinkId(l.source) === targetId && getLinkId(l.target) === connectMode.source)
    );

    if (!linkExists) {
      try {
        const linkData = { source: connectMode.source, target: targetId };
        const createdLink = await api.createLink(linkData);
        const newLink: GraphLink = {
          id: createdLink.id,
          source: connectMode.source,
          target: targetId
        };
        setLinks(prev => [...prev, newLink]);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log('Link already exists between these nodes');
          // Reload links to sync with backend
          const freshLinks = await api.getLinks();
          setLinks(freshLinks);
        } else {
          console.error('Error creating link:', error);
        }
      }
    } else {
      console.log('Link already exists between these nodes');
    }
    setConnectMode({ active: false, source: null });
  };

  const handleAddTask = async (content: string, status: TaskStatus, skillId?: string | null, goalId?: string | null) => {
    try {
      const newTask = await api.createTask({ content, status, skillId: skillId || undefined, goalId: goalId || undefined });
      setTasks(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const updatedTask = { ...task, ...updates };
        await api.updateTask(taskId, {
          content: updatedTask.content,
          status: updatedTask.status,
          skillId: updatedTask.skillId || undefined,
          goalId: updatedTask.goalId || undefined,
          subtasks: updatedTask.subtasks
        });
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddSkill = async (title: string, summary: string, category: string) => {
    try {
      const newSkill = await api.createSkill({ title, summary, progress: 0, color: badgeColors['Skill'], category });
      setSkills(prev => [...prev, newSkill]);
    } catch (error) {
      console.error('Error creating skill:', error);
    }
  };

  const handleUpdateSkill = async (updatedSkill: Skill) => {
    try {
      await api.updateSkill(updatedSkill.id, updatedSkill);
      setSkills(prev => prev.map(s => s.id === updatedSkill.id ? updatedSkill : s));
    } catch (error) {
      console.error('Error updating skill:', error);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (window.confirm("Are you sure you want to delete this skill? Associated tasks will be unlinked.")) {
      try {
        await api.deleteSkill(skillId);
        setSkills(prev => prev.filter(s => s.id !== skillId));
        // Unlink tasks
        const affectedTasks = tasks.filter(t => t.skillId === skillId);
        for (const task of affectedTasks) {
          await api.updateTask(task.id, { skillId: undefined });
        }
        setTasks(prev => prev.map(t => t.skillId === skillId ? { ...t, skillId: null } : t));
        // Remove from map if exists
        const mapNodeId = `map-${skillId}`;
        const mapNode = nodes.find(n => n.id === mapNodeId);
        if (mapNode) {
          await handleDeleteNode(mapNodeId);
        }
      } catch (error) {
        console.error('Error deleting skill:', error);
      }
    }
  };

  const handleShareSkillToMap = async (skill: Skill) => {
    const correspondingNodeId = `map-${skill.id}`;
    if (nodes.some(n => n.id === correspondingNodeId)) {
      setActiveTab('map');
      setSelectedNodeId(correspondingNodeId);
      return;
    }

    try {
      const newNode = await api.createNode({
        title: skill.title,
        summary: skill.summary,
        type: 'Skill',
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
        color: skill.color
      });
      // Store mapping between skill ID and node ID if needed for future reference
      setNodes(prev => [...prev, newNode]);
      setActiveTab('map');
      setTimeout(() => setSelectedNodeId(newNode.id), 100);
    } catch (error) {
      console.error('Error sharing skill to map:', error);
    }
  };

  const handleAddTaskToMap = async (task: Task) => {
    const existingNode = nodes.find(n => n.title === task.content);
    if (existingNode) {
      setActiveTab('map');
      setSelectedNodeId(existingNode.id);
      return;
    }

    try {
      const newNode = await api.createNode({
        title: task.content,
        summary: '',
        type: 'Task',
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
        color: badgeColors['Task']
      });
      setNodes(prev => [...prev, newNode]);
      setActiveTab('map');
      setTimeout(() => setSelectedNodeId(newNode.id), 100);
    } catch (error) {
      console.error('Error adding task to map:', error);
    }
  };

  const handleAddGoal = async (goalData: Omit<Goal, 'id'>, linkedTaskIds: string[]) => {
    try {
      const newGoal = await api.createGoal(goalData);
      setGoals(prev => [...prev, newGoal]);
      // Link tasks to goal
      for (const taskId of linkedTaskIds) {
        await api.updateTask(taskId, { goalId: newGoal.id });
      }
      setTasks(prev => prev.map(t => linkedTaskIds.includes(t.id) ? { ...t, goalId: newGoal.id } : t));
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleAddGoalToMap = async (title: string, description: string) => {
    try {
      const newNode = await api.createNode({
        title,
        summary: description,
        type: 'Goal',
        url: '',
        x: window.innerWidth / 2,
        y: window.innerHeight / 3
      });
      setNodes(prev => [...prev, newNode]);
      setActiveTab('map');
      setTimeout(() => setSelectedNodeId(newNode.id), 100);
    } catch (error) {
      console.error('Error creating goal node:', error);
    }
  };

  const handleUpdateGoal = async (goalId: string, goalData: Omit<Goal, 'id'>, linkedTaskIds: string[]) => {
    try {
      await api.updateGoal(goalId, goalData);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...goalData } : g));

      // Update task links
      const previouslyLinked = tasks.filter(t => t.goalId === goalId).map(t => t.id);
      const toUnlink = previouslyLinked.filter(id => !linkedTaskIds.includes(id));
      const toLink = linkedTaskIds.filter(id => !previouslyLinked.includes(id));

      for (const taskId of toUnlink) {
        await api.updateTask(taskId, { goalId: undefined });
      }
      for (const taskId of toLink) {
        await api.updateTask(taskId, { goalId: goalId });
      }

      setTasks(prev => prev.map(t => {
        if (linkedTaskIds.includes(t.id)) return { ...t, goalId };
        if (t.goalId === goalId) return { ...t, goalId: null };
        return t;
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await api.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      // Unlink tasks
      const affectedTasks = tasks.filter(t => t.goalId === goalId);
      for (const task of affectedTasks) {
        await api.updateTask(task.id, { goalId: undefined });
      }
      setTasks(prev => prev.map(t => t.goalId === goalId ? { ...t, goalId: null } : t));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Finance handlers
  const handleAddCard = async (cardData: Omit<Card, 'id'>) => {
    try {
      const newCard = await api.createCard(cardData);
      setCards(prev => [...prev, newCard]);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleAddIncome = async (incomeData: Omit<IncomeEntry, 'id'>) => {
    try {
      const newIncome = await api.createIncome(incomeData);
      setIncome(prev => [...prev, newIncome]);
    } catch (error) {
      console.error('Error creating income:', error);
    }
  };

  const handleAddExpense = async (expenseData: Omit<ExpenseEntry, 'id'>) => {
    try {
      const newExpense = await api.createExpense(expenseData);
      setExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleAddInvestment = async (investmentData: Omit<InvestmentEntry, 'id'>) => {
    try {
      const newInvestment = await api.createInvestment(investmentData);
      setInvestments(prev => [...prev, newInvestment]);
    } catch (error) {
      console.error('Error creating investment:', error);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await api.deleteIncome(id);
      setIncome(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      await api.deleteInvestment(id);
      setInvestments(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting investment:', error);
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      await api.deleteCard(id);
      setCards(cards.filter(card => card.id !== id));
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleUpdateCard = async (id: string, updatedCard: Omit<Card, 'id'>) => {
    try {
      const updated = await api.updateCard(id, updatedCard);
      setCards(cards.map(card => card.id === id ? updated : card));
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleClearAllData = async () => {
    try {
      setLoading(true);
      await api.clearAllData();
      // Reset all state
      setNodes([]);
      setLinks([]);
      setTasks([]);
      setSkills([]);
      setGoals([]);
      setCards([]);
      setIncome([]);
      setExpenses([]);
      setInvestments([]);
      setShowClearDataModal(false);
      alert('All data has been cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTop: '4px solid var(--primary-color)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Mind Space...</p>
      </div>
    );
  }

  return (
    <>
      {/* Global Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .content-area {
            overflow: auto !important;
            padding: 0 !important;
          }
          .top-bar {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
        }
      `}</style>

      {/* Top Bar */}
      <div style={styles.topBar} className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Hamburger Menu Button - visible on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div style={styles.logo}>Mind Space</div>
        </div>
        <div style={styles.topBarActions}>
          <button
            style={styles.settingsButton}
            onClick={() => setActiveTab('settings')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Navigation Drawer */}
      <nav className={`nav-sidebar-mobile ${isMobileMenuOpen ? 'open' : ''}`}>
        <button
          className="close-btn"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Mind Space</div>
        </div>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
          { id: 'map', label: 'Mind Map', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg> },
          { id: 'linkWeaver', label: 'Link Weaver', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> },
          { id: 'action', label: 'Action Center', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg> },
          { id: 'skills', label: 'Skills Matrix', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"></path></svg> },
          { id: 'finance', label: 'Finance', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> },
          { id: 'journal', label: 'Journal', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            style={{
              ...styles.navButton,
              ...(activeTab === id ? styles.navButtonActive : {}),
              padding: '0.85rem 1rem',
              fontSize: '0.85rem',
            }}
            onClick={() => {
              setActiveTab(id as ActiveTab);
              setIsMobileMenuOpen(false);
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            style={{
              ...styles.navButton,
              ...(activeTab === 'settings' ? styles.navButtonActive : {}),
              padding: '0.85rem 1rem',
              fontSize: '0.85rem',
            }}
            onClick={() => {
              setActiveTab('settings');
              setIsMobileMenuOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ ...styles.container, marginTop: '0px', padding: '0rem 0rem 1.35rem 1.35rem' }} className="main-container">
        {/* Navigation Sidebar - Desktop only */}
        <nav style={styles.navSidebar} className="desktop-sidebar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
            { id: 'map', label: 'Mind Map', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg> },
            { id: 'linkWeaver', label: 'Link Weaver', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> },
            { id: 'action', label: 'Action Center', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg> },
            { id: 'skills', label: 'Skills Matrix', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"></path></svg> },
            { id: 'finance', label: 'Finance', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> },
            { id: 'journal', label: 'Journal', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              style={{
                ...styles.navButton,
                ...(activeTab === id ? styles.navButtonActive : {}),
              }}
              onClick={() => setActiveTab(id as ActiveTab)}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main style={styles.mainAppContainer} className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard
              nodes={nodes}
              links={links}
              tasks={tasks}
              skills={skills}
              goals={goals}
              income={income}
              expenses={expenses}
              investments={investments}
              setActiveTab={setActiveTab}
              setSelectedNodeId={setSelectedNodeId}
            />
          )}
          {activeTab === 'map' && (
            <GraphCanvas
              nodes={nodes}
              links={links}
              searchTerm={searchTerm}
              selectedNodeId={selectedNodeId}
              connectMode={connectMode}
              tooltip={tooltip}
              onManualAdd={handleManualAdd}
              setTooltip={setTooltip}
              setSelectedNodeId={setSelectedNodeId}
              setConnectMode={setConnectMode}
              setNodes={setNodes}
              onNodeClickConnect={handleNodeClickConnect}
            />
          )}
          {activeTab === 'linkWeaver' && (
            <LinkWeaverView
              nodes={nodes}
              onAddNode={handleAddLinkNode}
            />
          )}
          {activeTab === 'action' && (
            <ActionCenter
              tasks={tasks}
              skills={skills}
              goals={goals}
              nodes={nodes}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onAddTaskToMap={handleAddTaskToMap}
              onUpdateTask={handleUpdateTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              draggingTaskId={draggingTaskId}
              setDraggingTaskId={setDraggingTaskId}
              setActiveTab={setActiveTab}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddGoalToMap={handleAddGoalToMap}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsView
              skills={skills}
              nodes={nodes}
              links={links}
              setActiveTab={setActiveTab}
              selectedSkillId={selectedSkillId}
              setSelectedSkillId={setSelectedSkillId}
              onAddSkill={handleAddSkill}
              onUpdateSkill={handleUpdateSkill}
              onDeleteSkill={handleDeleteSkill}
              onShareSkillToMap={handleShareSkillToMap}
            />
          )}
          {activeTab === 'finance' && (
            <FinanceView
              income={income}
              expenses={expenses}
              investments={investments}
              cards={cards}
              onAddIncome={handleAddIncome}
              onAddExpense={handleAddExpense}
              onAddInvestment={handleAddInvestment}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onDeleteIncome={handleDeleteIncome}
              onDeleteExpense={handleDeleteExpense}
              onDeleteInvestment={handleDeleteInvestment}
            />
          )}
          {activeTab === 'journal' && (
            <JournalView />
          )}

          {activeTab === 'settings' && (
            <div style={{ padding: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Settings</h1>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '800px'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Preferences</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Theme</label>
                    <p style={{ color: 'var(--text-primary)' }}>Dark Mode (Default)</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Data Management</label>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Backend: http://localhost:8000</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>All data is stored locally in SQLite database</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Version</label>
                    <p style={{ color: 'var(--text-primary)' }}>Mind Space v1.0.0</p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Danger Zone</label>
                    <button
                      onClick={() => setShowClearDataModal(true)}
                      style={{
                        backgroundColor: 'rgba(255, 69, 58, 0.1)',
                        border: '1px solid #ff453a',
                        borderRadius: '8px',
                        color: '#ff453a',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.1)';
                      }}
                    >
                      Clear All Data
                    </button>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      This will permanently delete all nodes, tasks, skills, goals, finance data, and journal entries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {tooltip.visible && (
        <div style={{ ...styles.tooltip, top: tooltip.y, left: tooltip.x, transform: 'translate(-50%, -100%)' }}>
          {tooltip.content}
        </div>
      )}
      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          nodes={nodes}
          links={links}
          onClose={() => setSelectedNodeId(null)}
          setLinks={setLinks}
          setConnectMode={setConnectMode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
        />
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearDataModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1c1c1e',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff453a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Clear All Data?</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              This action cannot be undone. All of your data will be permanently deleted, including:
            </p>
            <ul style={{ color: 'var(--text-secondary)', marginBottom: '2rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>All nodes and connections in the Mind Map</li>
              <li>All tasks and subtasks</li>
              <li>All skills and goals</li>
              <li>All finance data (cards, income, expenses, investments)</li>
              <li>All journal entries</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClearDataModal(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                style={{
                  backgroundColor: '#ff453a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d93d33';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff453a';
                }}
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
