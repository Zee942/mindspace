import * as d3 from 'd3';
import type React from 'react';

// Enum types
export type NodeType = 'Task' | 'Skill' | 'Goal' | 'Link';
export type ActiveTab = 'dashboard' | 'map' | 'linkWeaver' | 'action' | 'skills' | 'finance' | 'journal' | 'settings';
export type TaskStatus = 'To Do' | 'Done';
export type FinanceView = 'wallet' | 'transactions' | 'overview';
export type ActionView = 'tasks' | 'goals';

// Finance types
export type Card = {
  id: string;
  nickname: string;
  bank_name: string;
  cardholder_name: string;
  limit: number;
  card_type: 'Debit' | 'Credit';
  theme: string;
};

export type Transaction = {
  id: string;
  source: string;
  amount: number;
  tags: string[];
  date: string; // ISO string for simplicity e.g., '2025-01-09'
};

export type IncomeEntry = Transaction;
export type ExpenseEntry = Transaction;
export type InvestmentEntry = Transaction;

// Learning types
export type Skill = {
  id: string;
  title: string;
  summary: string;
  progress: number;
  color: string;
  category: string;
};

export type Goal = {
  id: string;
  title: string;
  summary: string;
};

// Journal types
export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  date: string;
  photos: string[];
  voiceNotes: string[];
  tags: string[];
};

// Graph types
export type Node = d3.SimulationNodeDatum & {
  id: string;
  title: string;
  summary: string;
  type: NodeType;
  url?: string;
  color?: string;
  progress?: number;
  completed?: boolean;
};

export interface GraphLink extends d3.SimulationLinkDatum<Node> {
  id?: string; // Database ID from backend
  source: Node | string | number;
  target: Node | string | number;
}

export interface Tooltip {
  content: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface ConnectMode {
  active: boolean;
  source: string | null;
}

// Task types
export type Subtask = {
  id: string;
  content: string;
  completed: boolean;
};

export type Task = {
  id: string;
  content: string;
  status: TaskStatus;
  skillId?: string | null;
  goalId?: string | null;
  subtasks?: Subtask[];
};

// Share action types
export type PendingTaskShare = {
    type: 'Task';
    data: Task;
}

export type PendingSkillShare = {
    type: 'Skill';
    data: Skill;
}

export type PendingGoalShare = {
    type: 'Goal';
    data: Goal;
}

export type PendingShareAction = PendingTaskShare | PendingSkillShare | PendingGoalShare;

// Constants
export const nodeTypes: NodeType[] = ['Task', 'Skill', 'Goal', 'Link'];

export const badgeColors: Record<NodeType, string> = {
  Task: '#34aadc',
  Skill: '#34d17d',
  Goal: '#ff9f0a',
  Link: '#bf5af2',
};

export const taskStatusColors: Record<TaskStatus, { bg: string, card: string, dot: string }> = {
  'To Do': { bg: 'transparent', card: 'transparent', dot: '#ff453a' },
  'Done': { bg: 'transparent', card: 'transparent', dot: '#32d74b' },
};

export const cardThemes: Record<string, React.CSSProperties> = {
  default: { background: 'linear-gradient(135deg, #4c4c4c, #2c2c2c)' },
  red: { background: 'linear-gradient(135deg, #D7263D, #9b1d2d)' },
  blue: { background: 'linear-gradient(135deg, #2D9CDB, #1a5c82)' },
  qnb: { background: 'linear-gradient(135deg, #1c3d7e, #0e1e3f)' },
  purple: {
    backgroundImage: `
      radial-gradient(circle at 100% 100%, transparent 10px, #a066ff 10px, #a066ff 12px, transparent 12px),
      linear-gradient(to right, #a066ff, #5856d6),
      radial-gradient(circle at 0% 100%, transparent 10px, #5856d6 10px, #5856d6 12px, transparent 12px),
      linear-gradient(to bottom, #5856d6, #5856d6)
    `,
    backgroundSize: '12px 12px, calc(100% - 24px) 2px, 12px 12px, 2px calc(100% - 24px)',
    backgroundPosition: 'bottom left, top center, bottom right, left center',
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat',
    backgroundColor: '#332352'
  }
};

export const tagColors = [
    '#ff9f0a', '#ff453a', '#32d74b', '#007aff', '#a066ff', '#5856d6', '#ff2d55'
];
