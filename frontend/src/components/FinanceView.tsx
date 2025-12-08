import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, IncomeEntry, ExpenseEntry, InvestmentEntry, FinanceView as FinanceViewType, Transaction } from '../types';
import { styles } from '../styles/styles';
import { EmptyState } from './EmptyState';

const cardThemes: Record<string, React.CSSProperties> = {
    default: { background: 'linear-gradient(135deg, #4c4c4c, #2c2c2c)' },
    red: { background: 'linear-gradient(135deg, #D7263D, #9b1d2d)' },
    blue: { background: 'linear-gradient(135deg, #2D9CDB, #1a5c82)' },
    qnb: { background: 'linear-gradient(135deg, #1c3d7e, #0e1e3f)' },
    purple: {
        backgroundImage: `
      radial-gradient(circle at 100% 100%, transparent 7px, #a066ff 7px, #a066ff 8px, transparent 8px),
      linear-gradient(to right, #a066ff, #5856d6),
      radial-gradient(circle at 0% 100%, transparent 7px, #5856d6 7px, #5856d6 8px, transparent 8px),
      linear-gradient(to bottom, #5856d6, #5856d6)
    `,
        backgroundSize: '8px 8px, calc(100% - 16px) 2px, 8px 8px, 2px calc(100% - 16px)',
        backgroundPosition: 'bottom left, top center, bottom right, left center',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat',
        backgroundColor: '#332352'
    }
};

const tagColors = [
    '#ff9f0a', '#ff453a', '#32d74b', '#007aff', '#a066ff', '#5856d6', '#ff2d55'
];

const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % tagColors.length;
    return { backgroundColor: tagColors[colorIndex], color: '#fff' };
};

const AddCardModal: React.FC<{ onClose: () => void; onAdd: (cardData: Omit<Card, 'id'>) => void; }> = ({ onClose, onAdd }) => {
    const [nickname, setNickname] = useState('');
    const [bankName, setBankName] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [limit, setLimit] = useState('');
    const [cardType, setCardType] = useState<'Debit' | 'Credit'>('Credit');
    const [theme, setTheme] = useState('default');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname || !bankName || !cardholderName || !limit) return;
        onAdd({ nickname, bank_name: bankName, cardholder_name: cardholderName, limit: parseFloat(limit), card_type: cardType, theme });
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{ ...styles.modalContainer, maxWidth: '370px' }} onClick={(e) => e.stopPropagation()}>
                <header>
                    <h1 style={{ ...styles.h1, fontSize: '1.35rem' }}>Add New Card</h1>
                    <p style={styles.p}>Enter the details for your new card.</p>
                </header>
                <form style={styles.form} onSubmit={handleSubmit}>
                    <input type="text" style={styles.input} placeholder="Card Nickname" value={nickname} onChange={e => setNickname(e.target.value)} required />
                    <input type="text" style={styles.input} placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} required />
                    <input type="text" style={styles.input} placeholder="Cardholder Name" value={cardholderName} onChange={e => setCardholderName(e.target.value)} required />
                    <input type="number" style={styles.input} placeholder="Limit / Balance" value={limit} onChange={e => setLimit(e.target.value)} required />
                    <select style={styles.select} value={cardType} onChange={e => setCardType(e.target.value as any)}>
                        <option style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>Credit</option>
                        <option style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>Debit</option>
                    </select>
                    <div>
                        <label style={styles.label}>Card Theme</label>
                        <div style={styles.themePicker}>
                            {Object.keys(cardThemes).map(themeKey => (
                                <div key={themeKey} onClick={() => setTheme(themeKey)} style={{ ...styles.themeOption, ...cardThemes[themeKey], borderColor: theme === themeKey ? 'var(--primary-color)' : 'transparent' }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.65rem' }}>
                        <button type="button" onClick={onClose} style={{ ...styles.button, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>Cancel</button>
                        <button type="submit" style={styles.button}>Add Card</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditCardModal: React.FC<{ onClose: () => void; onUpdate: (cardData: Omit<Card, 'id'>) => void; card: Card; }> = ({ onClose, onUpdate, card }) => {
    const [nickname, setNickname] = useState(card.nickname);
    const [bankName, setBankName] = useState(card.bank_name);
    const [cardholderName, setCardholderName] = useState(card.cardholder_name);
    const [limit, setLimit] = useState(card.limit.toString());
    const [cardType, setCardType] = useState<'Debit' | 'Credit'>(card.card_type);
    const [theme, setTheme] = useState(card.theme);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname || !bankName || !cardholderName || !limit) return;
        onUpdate({ nickname, bank_name: bankName, cardholder_name: cardholderName, limit: parseFloat(limit), card_type: cardType, theme });
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{ ...styles.modalContainer, maxWidth: '370px' }} onClick={(e) => e.stopPropagation()}>
                <header>
                    <h1 style={{ ...styles.h1, fontSize: '1.35rem' }}>Edit Card</h1>
                    <p style={styles.p}>Update your card details.</p>
                </header>
                <form style={styles.form} onSubmit={handleSubmit}>
                    <input type="text" style={styles.input} placeholder="Card Nickname" value={nickname} onChange={e => setNickname(e.target.value)} required />
                    <input type="text" style={styles.input} placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} required />
                    <input type="text" style={styles.input} placeholder="Cardholder Name" value={cardholderName} onChange={e => setCardholderName(e.target.value)} required />
                    <input type="number" style={styles.input} placeholder="Limit / Balance" value={limit} onChange={e => setLimit(e.target.value)} required />
                    <select style={styles.select} value={cardType} onChange={e => setCardType(e.target.value as any)}>
                        <option style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>Credit</option>
                        <option style={{ backgroundColor: '#2d2d30', color: '#ffffff' }}>Debit</option>
                    </select>
                    <div>
                        <label style={styles.label}>Card Theme</label>
                        <div style={styles.themePicker}>
                            {Object.keys(cardThemes).map(themeKey => (
                                <div key={themeKey} onClick={() => setTheme(themeKey)} style={{ ...styles.themeOption, ...cardThemes[themeKey], borderColor: theme === themeKey ? 'var(--primary-color)' : 'transparent' }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.65rem' }}>
                        <button type="button" onClick={onClose} style={{ ...styles.button, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>Cancel</button>
                        <button type="submit" style={styles.button}>Update Card</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TransactionTable: React.FC<{
    title: string;
    entries: Transaction[];
    onAdd: (entry: Omit<Transaction, 'id'>) => void;
    onDelete: (id: string) => void;
    type: 'income' | 'expense' | 'investment';
}> = ({ title, entries, onAdd, onDelete, type }) => {
    const [source, setSource] = useState('');
    const [amount, setAmount] = useState('');
    const [tags, setTags] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [showForm, setShowForm] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!source || !amount || !date) return;
        onAdd({
            source,
            amount: parseFloat(amount),
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            date,
        });
        setSource('');
        setAmount('');
        setTags('');
        setDate(new Date().toISOString().split('T')[0]);
        setShowForm(false);
    };

    const totalAmount = useMemo(() => entries.reduce((sum, entry) => sum + entry.amount, 0), [entries]);

    return (
        <div style={styles.transactionTableContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ ...styles.h1, fontSize: '1rem', margin: 0 }}>{title}</h2>
                <button onClick={() => setShowForm(!showForm)} style={{ ...styles.button, width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}>
                    {showForm ? 'Cancel' : '+ New'}
                </button>
            </div>
            {showForm && (
                <form style={styles.transactionForm} onSubmit={handleSubmit}>
                    <input
                        type="text"
                        style={styles.input}
                        placeholder="Source (e.g., Acme Inc.)"
                        value={source}
                        onChange={e => setSource(e.target.value)}
                        required
                    />
                    <div style={styles.transactionFormInputs}>
                        <input
                            type="number"
                            style={styles.input}
                            placeholder="Amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                        />
                        <input
                            type="date"
                            style={styles.input}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <input
                        type="text"
                        style={styles.input}
                        placeholder="Tags (comma-separated)"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                    />
                    <button type="submit" style={styles.button}>Add {type}</button>
                </form>
            )}
            <div style={styles.transactionTable}>
                <div style={{ ...styles.transactionRow, ...styles.transactionRowHeader }}>
                    <span>Source</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                    <span>Tags</span>
                    <span>Date</span>
                    <span></span>
                </div>
                {entries.map(entry => (
                    <div key={entry.id} style={styles.transactionRow}>
                        <span style={styles.transactionCell}>{entry.source}</span>
                        <span style={{ ...styles.transactionCell, textAlign: 'right' }}>{formatCurrency(entry.amount)}</span>
                        <div style={{ ...styles.transactionCell, ...styles.transactionTags }}>
                            {entry.tags.map(tag => (
                                <span key={tag} style={{ ...styles.transactionTag, ...getTagColor(tag) }}>{tag}</span>
                            ))}
                        </div>
                        <span style={styles.transactionCell}>{new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                        <button
                            onClick={() => onDelete(entry.id)}
                            style={{ ...styles.taskCardActionButton, color: 'var(--danger-color)' }}
                            aria-label={`Delete ${entry.source}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                ))}
                <div style={{ ...styles.transactionRow, borderBottom: 'none', marginTop: '0.35rem' }}>
                    <span style={{ ...styles.transactionRowHeader }}>SUM</span>
                    <span style={{ ...styles.transactionRowHeader, textAlign: 'right', fontSize: '0.75rem' }}>{formatCurrency(totalAmount)}</span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
};

export const FinanceView: React.FC<{
    income: IncomeEntry[];
    expenses: ExpenseEntry[];
    investments: InvestmentEntry[];
    cards: Card[];
    onAddIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
    onAddExpense: (entry: Omit<ExpenseEntry, 'id'>) => void;
    onAddInvestment: (entry: Omit<InvestmentEntry, 'id'>) => void;
    onAddCard: (card: Omit<Card, 'id'>) => void;
    onUpdateCard: (id: string, card: Omit<Card, 'id'>) => void;
    onDeleteCard: (id: string) => void;
    onDeleteIncome: (id: string) => void;
    onDeleteExpense: (id: string) => void;
    onDeleteInvestment: (id: string) => void;
}> = ({ income, expenses, investments, cards, onAddIncome, onAddExpense, onAddInvestment, onAddCard, onUpdateCard, onDeleteCard, onDeleteIncome, onDeleteExpense, onDeleteInvestment }) => {
    const [activeQuarter, setActiveQuarter] = useState<number | null>(null);
    const [financeView, setFinanceView] = useState<FinanceViewType>('overview');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(cards[0]?.id || null);
    const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false); useEffect(() => {
        if (!selectedCardId && cards.length > 0) {
            setSelectedCardId(cards[0].id);
        } else if (cards.length === 0) {
            setSelectedCardId(null);
        }
    }, [cards, selectedCardId]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setDragStart(clientX);
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || dragStart === null) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const offset = clientX - dragStart;
        // Limit drag to prevent going under sidebar (max 150px to the right)
        const clampedOffset = Math.max(-500, Math.min(150, offset));
        setDragOffset(clampedOffset);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 100;
        const selectedIndex = cards.findIndex(c => c.id === selectedCardId);

        if (dragOffset < -threshold && selectedIndex < cards.length - 1) {
            // Swipe left - next card
            setSelectedCardId(cards[selectedIndex + 1].id);
        } else if (dragOffset > threshold && selectedIndex > 0) {
            // Swipe right - previous card
            setSelectedCardId(cards[selectedIndex - 1].id);
        }

        setDragOffset(0);
        setDragStart(null);
    };

    const handleAddCard = (cardData: Omit<Card, 'id'>) => {
        onAddCard(cardData);
        setIsAddCardModalOpen(false);
    };

    const handleEditCard = (cardData: Omit<Card, 'id'>) => {
        if (editingCard) {
            onUpdateCard(editingCard.id, cardData);
            setEditingCard(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const monthlyData = useMemo(() => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months.map((monthName, index) => {
            const monthlyIncome = income
                .filter(i => new Date(i.date).getUTCMonth() === index)
                .reduce((sum, i) => sum + i.amount, 0);
            const monthlyExpenses = expenses
                .filter(e => new Date(e.date).getUTCMonth() === index)
                .reduce((sum, e) => sum + e.amount, 0);

            return {
                name: monthName,
                quarter: Math.floor(index / 3) + 1,
                income: monthlyIncome,
                expenses: monthlyExpenses,
                net: monthlyIncome - monthlyExpenses,
                incomeEntries: income.filter(i => new Date(i.date).getUTCMonth() === index),
                expenseEntries: expenses.filter(e => new Date(e.date).getUTCMonth() === index),
            };
        });
    }, [income, expenses]);

    const filteredMonths = useMemo(() => {
        if (activeQuarter === null) return monthlyData;
        return monthlyData.filter(m => m.quarter === activeQuarter);
    }, [monthlyData, activeQuarter]);

    return (
        <>
            <style>{`
                @media (max-width: 768px) {
                    .finance-container {
                        padding: 0 0.5rem 1rem 0.5rem !important;
                    }
                    .finance-tabs {
                        flex-wrap: wrap !important;
                        gap: 0.35rem !important;
                    }
                    .finance-tabs button {
                        padding: 0.4rem 0.75rem !important;
                        font-size: 0.6rem !important;
                    }
                    .finance-tabs button svg {
                        width: 14px !important;
                        height: 14px !important;
                        margin-right: 0.35rem !important;
                    }
                }
            `}</style>
            <div style={styles.financeContainer} className="finance-container">
                <div className="finance-tabs" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '1.35rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.35rem',
                    marginLeft: '0',
                }}>
                    <button
                        onClick={() => setFinanceView('overview')}
                        style={{
                            backgroundColor: financeView === 'overview' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: 'none',
                            borderRadius: '5px',
                            color: financeView === 'overview' ? '#6366f1' : 'var(--text-secondary)',
                            padding: '0.5rem 1rem',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                            if (financeView !== 'overview') {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (financeView !== 'overview') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                            <line x1="12" y1="20" x2="12" y2="10"></line>
                            <line x1="18" y1="20" x2="18" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="16"></line>
                        </svg>
                        Overview
                    </button>
                    <button
                        onClick={() => setFinanceView('transactions')}
                        style={{
                            backgroundColor: financeView === 'transactions' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: 'none',
                            borderRadius: '5px',
                            color: financeView === 'transactions' ? '#6366f1' : 'var(--text-secondary)',
                            padding: '0.5rem 1rem',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                            if (financeView !== 'transactions') {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (financeView !== 'transactions') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                            <path d="M3 3v18h18"></path>
                            <path d="m19 9-5 5-4-4-3 3"></path>
                        </svg>
                        Transactions
                    </button>
                    <button
                        onClick={() => setFinanceView('wallet')}
                        style={{
                            backgroundColor: financeView === 'wallet' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: 'none',
                            borderRadius: '5px',
                            color: financeView === 'wallet' ? '#6366f1' : 'var(--text-secondary)',
                            padding: '0.5rem 1rem',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                            if (financeView !== 'wallet') {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (financeView !== 'wallet') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                            <line x1="1" y1="10" x2="23" y2="10"></line>
                        </svg>
                        Wallet
                    </button>
                </div>

                {financeView === 'wallet' && (
                    <div style={styles.walletContainer}>
                        <header style={{ ...styles.header, ...styles.financeHeader, marginBottom: '1.35rem' }}>
                            <div>
                                <h1 style={styles.h1}>
                                    My Wallet
                                </h1>
                                <p style={styles.p}>Manage your cards and view recent transactions.</p>
                            </div>
                            <button style={{ ...styles.button, width: 'auto' }} onClick={() => setIsAddCardModalOpen(true)}>+ Add New Card</button>
                        </header>
                        {cards.length === 0 ? (
                            <EmptyState
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>}
                                title="Your Wallet is Empty"
                                message="Add a credit or debit card to get started with managing your finances."
                                action={<button style={{ ...styles.button, width: 'auto' }} onClick={() => setIsAddCardModalOpen(true)}>+ Add First Card</button>}
                            />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                                <div
                                    style={{ ...styles.walletCardStack, marginLeft: 'auto', marginRight: 'auto' }}
                                    onMouseDown={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                    onTouchStart={handleDragStart}
                                    onTouchMove={handleDragMove}
                                    onTouchEnd={handleDragEnd}
                                >
                                    {cards.map((card, index) => {
                                        const isSelected = selectedCardId === card.id;
                                        const selectedIndex = cards.findIndex(c => c.id === selectedCardId);
                                        let xTransform = (index - selectedIndex) * 60;

                                        if (isSelected) {
                                            xTransform = dragOffset;
                                        } else if (index < selectedIndex) {
                                            xTransform = xTransform - 20 + (dragOffset * 0.3);
                                        } else {
                                            xTransform = xTransform + 20 + (dragOffset * 0.3);
                                        }

                                        const scale = isSelected ? 1 : 0.95;
                                        const opacity = isSelected ? 1 : 0.7;
                                        const isFlipped = isSelected && flippedCardId === card.id;

                                        return (
                                            <div
                                                key={card.id}
                                                style={{
                                                    ...styles.walletCardWrapper,
                                                    zIndex: isSelected ? cards.length + 1 : cards.length - index,
                                                    transform: `translateX(${xTransform}px) scale(${scale})`,
                                                    opacity: opacity,
                                                    transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                    cursor: isDragging ? 'grabbing' : 'pointer',
                                                }}
                                                onClick={() => {
                                                    if (isDragging) return;
                                                    if (isSelected) {
                                                        setFlippedCardId(flippedCardId === card.id ? null : card.id);
                                                    } else {
                                                        setSelectedCardId(card.id);
                                                        setFlippedCardId(null);
                                                    }
                                                }}
                                            >
                                                <div style={{
                                                    ...styles.walletCardInner,
                                                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                                }}>
                                                    {/* Front of Card */}
                                                    <div style={styles.walletCardFront}>
                                                        <div style={styles.walletCard}>
                                                            <div style={{ ...styles.walletCardBg, ...cardThemes[card.theme] }} />
                                                            <div style={styles.walletCardHeader}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                    <span style={styles.walletCardBank}>{card.bank_name}</span>
                                                                    <span style={styles.walletCardNickname}>{card.nickname}</span>
                                                                </div>
                                                                <div style={styles.walletCardChip} />
                                                            </div>
                                                            <div style={styles.walletCardFooter}>
                                                                <div>
                                                                    <div style={{ ...styles.walletCardHolder, fontSize: '0.7rem', marginTop: 0, opacity: 0.8 }}>
                                                                        {card.card_type === 'Credit' ? 'Credit Limit' : 'Available Balance'}
                                                                    </div>
                                                                    <div style={{ ...styles.walletCardNumber, fontSize: '1.1rem', letterSpacing: '0.05em', marginTop: '0.15rem' }}>
                                                                        {formatCurrency(card.limit)}
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ ...styles.walletCardHolder, fontSize: '0.7rem', marginTop: 0, opacity: 0.8 }}>
                                                                        Card Holder
                                                                    </div>
                                                                    <div style={{ ...styles.walletCardHolder, marginTop: '0.25rem' }}>{card.cardholder_name}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Back of Card */}
                                                    <div style={styles.walletCardBack}>
                                                        <h3 style={{ ...styles.h1, fontSize: '1rem', color: '#fff', margin: 0 }}>Card Actions</h3>
                                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingCard(card);
                                                                }}
                                                                style={{
                                                                    ...styles.button,
                                                                    width: 'auto',
                                                                    background: 'rgba(255,255,255,0.1)',
                                                                    backdropFilter: 'blur(10px)',
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm(`Delete card "${card.nickname}"?`)) {
                                                                        onDeleteCard(card.id);
                                                                    }
                                                                }}
                                                                style={{
                                                                    ...styles.button,
                                                                    width: 'auto',
                                                                    background: 'rgba(220,38,38,0.8)',
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                Delete
                                                            </button>
                                                        </div>
                                                        <p style={{ ...styles.p, color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', marginTop: '0.5rem' }}>
                                                            Tap again to flip back
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ width: '100%' }}>
                                    <h2 style={{ ...styles.h1, fontSize: '1rem', marginBottom: '1rem' }}>Latest Transactions</h2>
                                    {expenses.length > 0 ? (
                                        <div style={styles.walletTransactionList}>
                                            {expenses.slice(0, 5).map(expense => (
                                                <div key={expense.id} style={styles.walletTransactionRow}>
                                                    <div>
                                                        <span style={{ color: 'var(--text-primary)', display: 'block' }}>{expense.source}</span>
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.55rem' }}>{new Date(expense.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                                    </div>
                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>- {formatCurrency(expense.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={styles.p}>No recent transactions found.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {financeView === 'overview' && (
                    <>
                        <header style={styles.financeHeader}>
                            <div>
                                <h1 style={styles.h1}>Total Savings</h1>
                                <p style={styles.p}>An overview of your income and expenses.</p>
                            </div>
                            <div style={styles.filterGroup}>
                                <button
                                    style={{ ...styles.filterButton, ...(activeQuarter === null ? styles.filterButtonActive : {}) }}
                                    onClick={() => setActiveQuarter(null)}
                                >All</button>
                                {[1, 2, 3, 4].map(q => (
                                    <button
                                        key={q}
                                        style={{ ...styles.filterButton, ...(activeQuarter === q ? styles.filterButtonActive : {}) }}
                                        onClick={() => setActiveQuarter(q)}
                                    >Q{q}</button>
                                ))}
                            </div>
                        </header>
                        <div style={styles.monthlyGrid}>
                            {filteredMonths.map(month => (
                                <div key={month.name} style={styles.monthCard}>
                                    <div style={styles.monthCardHeader}>
                                        <span style={{ ...styles.monthCardDot, backgroundColor: month.net > 0 ? '#32d74b' : '#ff453a' }}></span>
                                        {month.name}
                                    </div>
                                    <div style={styles.monthCardRow}>
                                        <span>Income</span>
                                        <span style={{ ...styles.monthCardValue, color: '#32d74b' }}>{formatCurrency(month.income)}</span>
                                    </div>
                                    <div style={styles.monthCardRow}>
                                        <span>Expenses</span>
                                        <span style={{ ...styles.monthCardValue, color: '#ff453a' }}>{formatCurrency(month.expenses)}</span>
                                    </div>
                                    <div style={{ ...styles.monthCardRow, borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', marginTop: '0.35rem' }}>
                                        <span style={{ fontWeight: 600 }}>Net</span>
                                        <span style={{ ...styles.monthCardValue, fontWeight: 600 }}>{formatCurrency(month.net)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {financeView === 'transactions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                        <TransactionTable
                            title="Income"
                            entries={income}
                            onAdd={(entry) => onAddIncome(entry as Omit<IncomeEntry, 'id'>)}
                            onDelete={onDeleteIncome}
                            type="income"
                        />
                        <TransactionTable
                            title="Expenses"
                            entries={expenses}
                            onAdd={(entry) => onAddExpense(entry as Omit<ExpenseEntry, 'id'>)}
                            onDelete={onDeleteExpense}
                            type="expense"
                        />
                        <TransactionTable
                            title="Investments"
                            entries={investments}
                            onAdd={(entry) => onAddInvestment(entry as Omit<InvestmentEntry, 'id'>)}
                            onDelete={onDeleteInvestment}
                            type="investment"
                        />
                    </div>
                )}
                {isAddCardModalOpen && <AddCardModal onClose={() => setIsAddCardModalOpen(false)} onAdd={handleAddCard} />}
                {editingCard && <EditCardModal onClose={() => setEditingCard(null)} onUpdate={handleEditCard} card={editingCard} />}
            </div>
        </>
    );
};
