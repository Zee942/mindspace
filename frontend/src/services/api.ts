// API Service for Mind Space
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Generic fetch wrapper
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    console.log(`API Request: ${endpoint}`);
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        console.log(`API Response (${endpoint}):`, response.status);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }

        if (response.status === 204) {
            return null as T;
        }

        return response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Node API
export const nodeAPI = {
    getAll: () => apiFetch<any[]>('/api/nodes'),
    getOne: (id: string) => apiFetch<any>(`/api/nodes/${id}`),
    create: (data: any) => apiFetch<any>('/api/nodes', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiFetch<any>(`/api/nodes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/nodes/${id}`, {
        method: 'DELETE',
    }),
};

// Link API
export const linkAPI = {
    getAll: () => apiFetch<any[]>('/api/links'),
    getForNode: (nodeId: string) => apiFetch<any[]>(`/api/links/node/${nodeId}`),
    create: (data: any) => apiFetch<any>('/api/links', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/links/${id}`, {
        method: 'DELETE',
    }),
};

// Task API
export const taskAPI = {
    getAll: () => apiFetch<any[]>('/api/tasks'),
    getOne: (id: string) => apiFetch<any>(`/api/tasks/${id}`),
    create: (data: any) => apiFetch<any>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiFetch<any>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/tasks/${id}`, {
        method: 'DELETE',
    }),
    createSubtask: (taskId: string, data: any) => apiFetch<any>(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateSubtask: (taskId: string, subtaskId: string, data: any) =>
        apiFetch<any>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    deleteSubtask: (taskId: string, subtaskId: string) =>
        apiFetch<void>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
            method: 'DELETE',
        }),
};

// Skill API
export const skillAPI = {
    getAll: () => apiFetch<any[]>('/api/skills'),
    getOne: (id: string) => apiFetch<any>(`/api/skills/${id}`),
    create: (data: any) => apiFetch<any>('/api/skills', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiFetch<any>(`/api/skills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/skills/${id}`, {
        method: 'DELETE',
    }),
};

// Goal API
export const goalAPI = {
    getAll: () => apiFetch<any[]>('/api/goals'),
    getOne: (id: string) => apiFetch<any>(`/api/goals/${id}`),
    getTasks: (id: string) => apiFetch<any[]>(`/api/goals/${id}/tasks`),
    create: (data: any) => apiFetch<any>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiFetch<any>(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/goals/${id}`, {
        method: 'DELETE',
    }),
};

// Card API
export const cardAPI = {
    getAll: () => apiFetch<any[]>('/api/cards'),
    getOne: (id: string) => apiFetch<any>(`/api/cards/${id}`),
    create: (data: any) => apiFetch<any>('/api/cards', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiFetch<any>(`/api/cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/cards/${id}`, {
        method: 'DELETE',
    }),
};

// Income API
export const incomeAPI = {
    getAll: () => apiFetch<any[]>('/api/income'),
    create: (data: any) => apiFetch<any>('/api/income', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/income/${id}`, {
        method: 'DELETE',
    }),
};

// Expense API
export const expenseAPI = {
    getAll: () => apiFetch<any[]>('/api/expenses'),
    create: (data: any) => apiFetch<any>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/expenses/${id}`, {
        method: 'DELETE',
    }),
};

// Investment API
export const investmentAPI = {
    getAll: () => apiFetch<any[]>('/api/investments'),
    create: (data: any) => apiFetch<any>('/api/investments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/investments/${id}`, {
        method: 'DELETE',
    }),
};

// Journal API
export const journalAPI = {
    getAll: () => apiFetch<any[]>('/api/journal'),
    getOne: (id: string) => apiFetch<any>(`/api/journal/${id}`),
    create: (data: any) => apiFetch<any>('/api/journal', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiFetch<any>(`/api/journal/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<void>(`/api/journal/${id}`, {
        method: 'DELETE',
    }),
};

// Health check
export const healthCheck = () => apiFetch<{status: string}>('/api/health');

// Simplified exports for easier use
export const getNodes = () => nodeAPI.getAll();
export const createNode = (data: any) => nodeAPI.create(data);
export const updateNode = (id: string, data: any) => nodeAPI.update(id, data);
export const deleteNode = (id: string) => nodeAPI.delete(id);

export const getLinks = () => linkAPI.getAll();
export const createLink = (data: any) => linkAPI.create(data);
export const deleteLink = (linkId: string) => linkAPI.delete(linkId);

export const getTasks = () => taskAPI.getAll();
export const createTask = (data: any) => taskAPI.create(data);
export const updateTask = (id: string, data: any) => taskAPI.update(id, data);
export const deleteTask = (id: string) => taskAPI.delete(id);

export const getSkills = () => skillAPI.getAll();
export const createSkill = (data: any) => skillAPI.create(data);
export const updateSkill = (id: string, data: any) => skillAPI.update(id, data);
export const deleteSkill = (id: string) => skillAPI.delete(id);

export const getGoals = () => goalAPI.getAll();
export const createGoal = (data: any) => goalAPI.create(data);
export const updateGoal = (id: string, data: any) => goalAPI.update(id, data);
export const deleteGoal = (id: string) => goalAPI.delete(id);

export const getCards = () => cardAPI.getAll();
export const createCard = (data: any) => cardAPI.create(data);
export const updateCard = (id: string, data: any) => cardAPI.update(id, data);
export const deleteCard = (id: string) => cardAPI.delete(id);

export const getIncome = () => incomeAPI.getAll();
export const createIncome = (data: any) => incomeAPI.create(data);
export const deleteIncome = (id: string) => incomeAPI.delete(id);

export const getExpenses = () => expenseAPI.getAll();
export const createExpense = (data: any) => expenseAPI.create(data);
export const deleteExpense = (id: string) => expenseAPI.delete(id);

export const getInvestments = () => investmentAPI.getAll();
export const createInvestment = (data: any) => investmentAPI.create(data);
export const deleteInvestment = (id: string) => investmentAPI.delete(id);

export const getJournalEntries = () => journalAPI.getAll();
export const createJournalEntry = (data: any) => journalAPI.create(data);
export const updateJournalEntry = (id: string, data: any) => journalAPI.update(id, data);
export const deleteJournalEntry = (id: string) => journalAPI.delete(id);

// Clear all data
export const clearAllData = async () => {
    // Delete all data by calling each endpoint's delete for all items
    const [nodes, tasks, skills, goals, cards, income, expenses, investments, journal] = await Promise.all([
        getNodes(),
        getTasks(),
        getSkills(),
        getGoals(),
        getCards(),
        getIncome(),
        getExpenses(),
        getInvestments(),
        getJournalEntries()
    ]);

    // Note: Links are cascade-deleted when nodes are deleted, so we don't need to delete them explicitly
    await Promise.all([
        ...nodes.map(n => deleteNode(n.id)),
        ...tasks.map(t => deleteTask(t.id)),
        ...skills.map(s => deleteSkill(s.id)),
        ...goals.map(g => deleteGoal(g.id)),
        ...cards.map(c => cardAPI.delete(c.id)),
        ...income.map(i => deleteIncome(i.id)),
        ...expenses.map(e => deleteExpense(e.id)),
        ...investments.map(i => deleteInvestment(i.id)),
        ...journal.map(j => deleteJournalEntry(j.id))
    ]);
};
