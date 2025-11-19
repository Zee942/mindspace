import React, { useMemo, useState } from 'react';
import type { Node, GraphLink, NodeType, ActiveTab, Task, Skill, Goal, IncomeEntry, ExpenseEntry, InvestmentEntry } from '../types';
import { nodeTypes } from '../types';
import { styles } from '../styles/styles';
import { getLinkId } from '../utils/helpers';

interface DashboardProps {
  nodes: Node[];
  links: GraphLink[];
  tasks: Task[];
  skills: Skill[];
  goals: Goal[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  investments: InvestmentEntry[];
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedNodeId: (id: string | null) => void;
}

/**
 * Dashboard component showing statistics and insights about the knowledge graph
 */
export const Dashboard: React.FC<DashboardProps> = ({
  nodes,
  links,
  tasks,
  skills,
  goals,
  income,
  expenses,
  investments,
  setActiveTab,
  setSelectedNodeId,
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'finance'>('overview');

  const nodeCounts = useMemo(() => {
    return nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<NodeType, number>);
  }, [nodes]);

  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    links.forEach(link => {
      const sourceId = getLinkId(link.source);
      const targetId = getLinkId(link.target);
      if (sourceId) counts.set(sourceId, (counts.get(sourceId) || 0) + 1);
      if (targetId) counts.set(targetId, (counts.get(targetId) || 0) + 1);
    });
    return counts;
  }, [links]);

  const orphanNodes = useMemo(() => {
    return nodes.filter(node => !connectionCounts.has(node.id));
  }, [nodes, connectionCounts]);

  const topHubs = useMemo(() => {
    return [...connectionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const node = nodes.find(n => n.id === id);
        return { node, count };
      })
      .filter(item => item.node);
  }, [nodes, connectionCounts]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setActiveTab('map');
  };

  // Finance calculations
  const totalIncome = useMemo(() => 
    income.reduce((sum, entry) => sum + entry.amount, 0), [income]
  );

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, entry) => sum + entry.amount, 0), [expenses]
  );

  const totalInvestments = useMemo(() => 
    investments.reduce((sum, entry) => sum + entry.amount, 0), [investments]
  );

  const netSavings = totalIncome - totalExpenses - totalInvestments;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthIncome = income.filter(i => {
        const date = new Date(i.date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      }).reduce((sum, i) => sum + i.amount, 0);

      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      }).reduce((sum, e) => sum + e.amount, 0);

      return {
        month,
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
      };
    });
  }, [income, expenses]);

  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)), 1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const topExpenseCategories = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      expense.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + expense.amount;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);
  }, [expenses]);

  const recentTransactions = useMemo(() => {
    const allTransactions = [
      ...income.map(i => ({ ...i, type: 'income' as const })),
      ...expenses.map(e => ({ ...e, type: 'expense' as const })),
      ...investments.map(i => ({ ...i, type: 'investment' as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allTransactions.slice(0, 6);
  }, [income, expenses, investments]);

  return (
    <div style={styles.dashboardContainer}>
      <header style={{ ...styles.header, marginBottom: '1.5rem' }}>
        <h1 style={{ ...styles.h1, marginTop: 0, marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={styles.p}>A high-level overview of your Mind Space.</p>
      </header>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.5rem',
        marginLeft: '0',
      }}>
        <button
          onClick={() => setActiveView('overview')}
          style={{
            backgroundColor: activeView === 'overview' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: activeView === 'overview' ? '#6366f1' : 'var(--text-secondary)',
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'overview') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'overview') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Overview
        </button>
        <button
          onClick={() => setActiveView('finance')}
          style={{
            backgroundColor: activeView === 'finance' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: activeView === 'finance' ? '#6366f1' : 'var(--text-secondary)',
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'finance') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'finance') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Finance
        </button>
      </div>

      {activeView === 'overview' ? (
        <>
          <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h2 style={styles.statCardTitle}>Total Nodes</h2>
          <p style={styles.statCardValue}>{nodes.length}</p>
        </div>
        <div style={styles.statCard}>
          <h2 style={styles.statCardTitle}>Tasks</h2>
          <p style={styles.statCardValue}>{tasks.length}</p>
        </div>
        <div style={styles.statCard}>
          <h2 style={styles.statCardTitle}>Skills</h2>
          <p style={styles.statCardValue}>{skills.length}</p>
        </div>
        <div style={styles.statCard}>
          <h2 style={styles.statCardTitle}>Goals</h2>
          <p style={styles.statCardValue}>{goals.length}</p>
        </div>
        <div style={styles.statCard}>
          <h2 style={styles.statCardTitle}>Links</h2>
          <p style={styles.statCardValue}>{links.length}</p>
        </div>
      </div>
      <div style={styles.insightsContainer}>
        <div style={styles.insightListContainer}>
          <h3 style={{ ...styles.nodeTitle, fontSize: '1.5rem' }}>Orphan Nodes</h3>
          <p style={{ ...styles.p, marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
            Nodes that are not connected to anything.
          </p>
          {orphanNodes.length > 0 ? (
            <ul style={styles.insightList}>
              {orphanNodes.map(node => (
                <li key={node.id} style={styles.insightListItem}>
                  <span>{node.title}</span>
                  <button
                    onClick={() => handleNodeClick(node.id)}
                    style={{
                      ...styles.button,
                      backgroundColor: 'var(--secondary-color)',
                      width: 'auto',
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.75rem',
                    }}
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.insightEmptyState}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 10.5c.3-.3.8-.3 1 0l2.5 2.5c.3.3.3.8 0 1l-2.5 2.5c-.2.2-.7.2-1 0m-5-5c-.3.3-.8.3-1 0l-2.5-2.5c-.3-.3-.3.8 0-1l2.5-2.5c.2-.2.7-.2-1 0m-5 15c.3-.3.8-.3 1 0l2.5 2.5c.3.3.3.8 0 1l-2.5 2.5c-.2.2-.7.2-1 0"></path>
                <path d="m21.5 21.5-2-2"></path>
                <path d="m8 8-2-2"></path>
                <path d="m16 8-2-2"></path>
                <path d="m16 16-2-2"></path>
                <path d="m8 16-2-2"></path>
              </svg>
              <p>No orphan nodes found. Great job connecting your ideas!</p>
            </div>
          )}
        </div>
        <div style={styles.insightListContainer}>
          <h3 style={{ ...styles.nodeTitle, fontSize: '1.5rem' }}>Top Hubs</h3>
          <p style={{ ...styles.p, marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
            Your most connected nodes.
          </p>
          {topHubs.length > 0 ? (
            <ul style={styles.insightList}>
              {topHubs.map(({ node, count }) =>
                node ? (
                  <li key={node.id} style={styles.insightListItem}>
                    <span>{node.title}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {count} connections
                    </span>
                  </li>
                ) : null
              )}
            </ul>
          ) : (
            <div style={styles.insightEmptyState}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
              </svg>
              <p>No connections yet. Start linking nodes on the map!</p>
            </div>
          )}
        </div>
      </div>
      </>
      ) : (
        /* Finance Dashboard View */
        <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{
              ...styles.statCard,
              background: 'linear-gradient(135deg, rgba(50, 215, 75, 0.1) 0%, rgba(50, 215, 75, 0.05) 100%)',
              border: '1px solid rgba(50, 215, 75, 0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(50, 215, 75, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ ...styles.statCardTitle, color: '#32d74b' }}>Total Income</h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#32d74b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </div>
              <p style={{ ...styles.statCardValue, color: '#32d74b' }}>{formatCurrency(totalIncome)}</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(50, 215, 75, 0.7)', marginTop: '0.5rem' }}>{income.length} transactions</p>
            </div>

            <div style={{
              ...styles.statCard,
              background: 'linear-gradient(135deg, rgba(255, 69, 58, 0.1) 0%, rgba(255, 69, 58, 0.05) 100%)',
              border: '1px solid rgba(255, 69, 58, 0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 69, 58, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ ...styles.statCardTitle, color: '#ff453a' }}>Total Expenses</h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff453a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                  <polyline points="16 17 22 17 22 11"></polyline>
                </svg>
              </div>
              <p style={{ ...styles.statCardValue, color: '#ff453a' }}>{formatCurrency(totalExpenses)}</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 69, 58, 0.7)', marginTop: '0.5rem' }}>{expenses.length} transactions</p>
            </div>

            <div style={{
              ...styles.statCard,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ ...styles.statCardTitle, color: '#6366f1' }}>Investments</h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <p style={{ ...styles.statCardValue, color: '#6366f1' }}>{formatCurrency(totalInvestments)}</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(99, 102, 241, 0.7)', marginTop: '0.5rem' }}>{investments.length} transactions</p>
            </div>

            <div style={{
              ...styles.statCard,
              background: netSavings >= 0 
                ? 'linear-gradient(135deg, rgba(50, 215, 75, 0.15) 0%, rgba(50, 215, 75, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255, 69, 58, 0.15) 0%, rgba(255, 69, 58, 0.05) 100%)',
              border: `1px solid ${netSavings >= 0 ? 'rgba(50, 215, 75, 0.3)' : 'rgba(255, 69, 58, 0.3)'}`,
              transform: 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 12px 24px ${netSavings >= 0 ? 'rgba(50, 215, 75, 0.2)' : 'rgba(255, 69, 58, 0.2)'}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ ...styles.statCardTitle, color: netSavings >= 0 ? '#32d74b' : '#ff453a' }}>Net Savings</h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={netSavings >= 0 ? '#32d74b' : '#ff453a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                  <path d="M12 18V6"></path>
                </svg>
              </div>
              <p style={{ ...styles.statCardValue, color: netSavings >= 0 ? '#32d74b' : '#ff453a' }}>{formatCurrency(netSavings)}</p>
              <p style={{ fontSize: '0.85rem', color: netSavings >= 0 ? 'rgba(50, 215, 75, 0.7)' : 'rgba(255, 69, 58, 0.7)', marginTop: '0.5rem' }}>
                {savingsRate.toFixed(1)}% savings rate
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Monthly Overview Chart */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem',
              transition: 'all 0.3s ease',
            }}>
              <h3 style={{ ...styles.nodeTitle, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Monthly Overview</h3>
              <div style={{ height: '280px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%', gap: '0.5rem' }}>
                  {monthlyData.map((data, index) => {
                    const incomeHeight = (data.income / maxValue) * 100;
                    const expenseHeight = (data.expenses / maxValue) * 100;
                    const hasData = data.income > 0 || data.expenses > 0;
                    
                    return (
                      <div key={data.month} style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        opacity: hasData ? 1 : 0.3,
                        transition: 'all 0.3s ease',
                      }}>
                        <div style={{ 
                          width: '100%', 
                          display: 'flex', 
                          gap: '2px', 
                          alignItems: 'flex-end', 
                          height: '220px',
                        }}>
                          <div
                            style={{
                              flex: 1,
                              height: `${incomeHeight}%`,
                              background: 'linear-gradient(180deg, #32d74b 0%, rgba(50, 215, 75, 0.6) 100%)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              transformOrigin: 'bottom',
                              animation: `slideUp 0.8s ease-out ${index * 0.05}s backwards`,
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'brightness(1)';
                            }}
                            title={`Income: ${formatCurrency(data.income)}`}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: `${expenseHeight}%`,
                              background: 'linear-gradient(180deg, #ff453a 0%, rgba(255, 69, 58, 0.6) 100%)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              transformOrigin: 'bottom',
                              animation: `slideUp 0.8s ease-out ${index * 0.05}s backwards`,
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'brightness(1)';
                            }}
                            title={`Expenses: ${formatCurrency(data.expenses)}`}
                          />
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-secondary)', 
                          fontWeight: 500 
                        }}>{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#32d74b' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Income</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ff453a' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expenses</span>
                </div>
              </div>
            </div>

            {/* Top Spending Categories */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem',
            }}>
              <h3 style={{ ...styles.nodeTitle, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Top Categories</h3>
              {topExpenseCategories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {topExpenseCategories.map(([category, amount], index) => {
                    const percentage = (amount / totalExpenses) * 100;
                    const colors = ['#ff453a', '#ff9f0a', '#ffd60a', '#32d74b', '#64d2ff'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={category} style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{category}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatCurrency(amount)}</span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          backgroundColor: 'rgba(255,255,255,0.05)', 
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
                            borderRadius: '4px',
                            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: `expandWidth 1s ease-out ${index * 0.1}s backwards`,
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                          {percentage.toFixed(1)}% of total
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, margin: '0 auto 1rem' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                    <path d="M12 18V6"></path>
                  </svg>
                  <p style={{ fontSize: '0.9rem' }}>No expense data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
          }}>
            <h3 style={{ ...styles.nodeTitle, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Recent Activity</h3>
            {recentTransactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentTransactions.map((transaction, index) => {
                  const typeColors = {
                    income: { bg: 'rgba(50, 215, 75, 0.1)', text: '#32d74b', border: 'rgba(50, 215, 75, 0.2)' },
                    expense: { bg: 'rgba(255, 69, 58, 0.1)', text: '#ff453a', border: 'rgba(255, 69, 58, 0.2)' },
                    investment: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.2)' },
                  };
                  const colors = typeColors[transaction.type];
                  
                  return (
                    <div
                      key={transaction.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: `slideInLeft 0.4s ease-out ${index * 0.05}s backwards`,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.backgroundColor = colors.bg.replace('0.1', '0.15');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.backgroundColor = colors.bg;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: colors.bg.replace('0.1', '0.2'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {transaction.type === 'income' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                              <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                          )}
                          {transaction.type === 'expense' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                              <polyline points="16 17 22 17 22 11"></polyline>
                            </svg>
                          )}
                          {transaction.type === 'investment' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="1" x2="12" y2="23"></line>
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {transaction.source}
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: colors.text, 
                              textTransform: 'capitalize',
                              fontWeight: 600,
                            }}>
                              {transaction.type}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>•</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 700, 
                          color: colors.text,
                          marginBottom: '0.25rem',
                        }}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        {transaction.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {transaction.tags.slice(0, 2).map(tag => (
                              <span key={tag} style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                backgroundColor: colors.bg.replace('0.1', '0.2'),
                                borderRadius: '6px',
                                color: colors.text,
                              }}>
                                {tag}
                              </span>
                            ))}
                            {transaction.tags.length > 2 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                +{transaction.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, margin: '0 auto 1rem' }}>
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No transactions yet</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Visit the Finance tab to add income, expenses, or investments</p>
              </div>
            )}
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes slideUp {
              from {
                transform: scaleY(0);
              }
              to {
                transform: scaleY(1);
              }
            }
            
            @keyframes expandWidth {
              from {
                width: 0;
              }
            }
            
            @keyframes slideInLeft {
              from {
                opacity: 0;
                transform: translateX(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
