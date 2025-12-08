import React, { useState, useEffect, useMemo } from 'react';
import { styles } from '../styles/styles';
import type { JournalEntry } from '../types';
import * as api from '../services/api';

export const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'calendar' | 'entries' | 'new'>('calendar');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  // Load journal entries from backend
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        const data = await api.getJournalEntries();
        setEntries(data);
      } catch (error) {
        console.error('Error loading journal entries:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  // Calendar calculations
  const monthStart = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  const startingDayOfWeek = monthStart.getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  }, [currentDate, startingDayOfWeek, daysInMonth]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach(entry => {
      const dateKey = new Date(entry.createdAt).toDateString();
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entriesByDate.get(selectedDate.toDateString()) || [];
  }, [selectedDate, entriesByDate]);

  const handleAddEntry = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      const newEntry = await api.createJournalEntry({
        title: title.trim(),
        content: content.trim(),
        photos: [],
        voiceNotes: [],
        tags,
      });
      setEntries([newEntry, ...entries]);
      resetForm();
      setActiveView('calendar');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Failed to create journal entry');
    }
  };

  const handleUpdateEntry = async () => {
    if (!selectedEntry || !title.trim() || !content.trim()) return;
    try {
      const updated = await api.updateJournalEntry(selectedEntry.id, {
        title: title.trim(),
        content: content.trim(),
        photos: selectedEntry.photos,
        voiceNotes: selectedEntry.voiceNotes,
        tags,
      });
      setEntries(entries.map(e => e.id === updated.id ? updated : e));
      resetForm();
      setSelectedEntry(null);
      setActiveView('entries');
    } catch (error) {
      console.error('Error updating journal entry:', error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await api.deleteJournalEntry(id);
      setEntries(entries.filter(e => e.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setCurrentTag('');
    setSelectedEntry(null);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setTags([...entry.tags]);
    setActiveView('new');
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateEntries = entriesByDate.get(date.toDateString()) || [];
    if (dateEntries.length > 0) {
      setActiveView('entries');
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .journal-container {
            padding: 0 0.5rem 1rem 0.5rem !important;
          }
          .calendar-view .calendar-grid {
            gap: 0.15rem !important;
          }
          .calendar-view .calendar-grid button {
            min-height: 36px !important;
            font-size: 0.65rem !important;
            padding: 0.2rem !important;
          }
          .calendar-view .calendar-grid button span:first-child {
            font-size: 0.65rem !important;
          }
          .calendar-view .calendar-grid button span:last-child {
            font-size: 0.45rem !important;
            padding: 1px 3px !important;
          }
        }
      `}</style>
      <div className="journal-container" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 1.35rem 1.35rem 1.35rem',
        overflow: 'auto',
      }}>
        {/* Header */}
        <header style={{ ...styles.header, marginBottom: '1rem', paddingTop: '0', marginTop: '0', flexShrink: 0 }}>
          <h1 style={styles.h1}>Journal</h1>
          <p style={styles.p}>Capture your thoughts and track your journey</p>
        </header>

        {/* Tab Navigation */}
        <div className="journal-tabs" style={{
          display: 'flex',
          gap: '0.35rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.35rem',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveView('calendar')}
            style={{
              backgroundColor: activeView === 'calendar' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeView === 'calendar' ? '#6366f1' : 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              fontSize: '0.65rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Calendar
          </button>
          <button
            onClick={() => setActiveView('entries')}
            style={{
              backgroundColor: activeView === 'entries' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeView === 'entries' ? '#6366f1' : 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              fontSize: '0.65rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            All Entries ({entries.length})
          </button>
          <button
            onClick={() => { resetForm(); setActiveView('new'); }}
            style={{
              backgroundColor: activeView === 'new' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeView === 'new' ? '#6366f1' : 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              fontSize: '0.65rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Entry
          </button>
        </div>

        {/* Main Content */}
        <div className="journal-content" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {/* Calendar View */}
          {activeView === 'calendar' && (
            <div className="calendar-view" style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Calendar Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={goToPreviousMonth}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button
                    onClick={goToNextMonth}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {monthName}
                  </h2>
                </div>
                <button
                  onClick={goToToday}
                  style={{
                    ...styles.button,
                    width: 'auto',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.65rem',
                  }}
                >
                  Today
                </button>
              </div>

              {/* Calendar Grid */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
              }}>
                {/* Weekday Headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '0.25rem',
                  marginBottom: '0.5rem',
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{
                      textAlign: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      padding: '0.25rem',
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="calendar-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '0.25rem',
                }}>
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
                    }

                    const dateEntries = entriesByDate.get(date.toDateString()) || [];
                    const hasEntries = dateEntries.length > 0;
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isTodayDate = isToday(date);

                    return (
                      <button
                        key={date.toDateString()}
                        onClick={() => handleDateClick(date)}
                        style={{
                          aspectRatio: '1',
                          backgroundColor: isSelected
                            ? 'rgba(99, 102, 241, 0.25)'
                            : isTodayDate
                              ? 'rgba(99, 102, 241, 0.1)'
                              : 'rgba(255,255,255,0.03)',
                          border: isSelected
                            ? '2px solid #6366f1'
                            : isTodayDate
                              ? '1px solid rgba(99, 102, 241, 0.4)'
                              : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          minHeight: '44px',
                        }}
                      >
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: isTodayDate ? 700 : 500,
                          color: isSelected || isTodayDate ? '#6366f1' : 'var(--text-primary)',
                        }}>
                          {date.getDate()}
                        </span>
                        {hasEntries && (
                          <span style={{
                            fontSize: '0.5rem',
                            backgroundColor: 'rgba(99, 102, 241, 0.4)',
                            borderRadius: '10px',
                            padding: '1px 5px',
                            color: '#a5b4fc',
                            fontWeight: 600,
                          }}>
                            {dateEntries.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Summary */}
              {selectedDate && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <span style={{
                      fontSize: '0.6rem',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '10px',
                      color: '#a5b4fc',
                      fontWeight: 600,
                    }}>
                      {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  {selectedDateEntries.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedDateEntries.slice(0, 3).map(entry => (
                        <div
                          key={entry.id}
                          onClick={() => handleEditEntry(entry)}
                          style={{
                            padding: '0.65rem',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <h4 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                            {entry.title}
                          </h4>
                          <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.content}
                          </p>
                        </div>
                      ))}
                      {selectedDateEntries.length > 3 && (
                        <button
                          onClick={() => setActiveView('entries')}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#6366f1',
                            fontSize: '0.65rem',
                            cursor: 'pointer',
                            padding: '0.35rem',
                          }}
                        >
                          View all {selectedDateEntries.length} entries →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                        No entries for this day
                      </p>
                      <button
                        onClick={() => setActiveView('new')}
                        style={{ ...styles.button, width: 'auto', padding: '0.5rem 1rem', fontSize: '0.65rem' }}
                      >
                        + Add Entry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* All Entries View */}
          {activeView === 'entries' && (
            <div className="entries-view" style={{ animation: 'fadeIn 0.3s ease' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>Loading entries...</div>
              ) : entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '1rem' }}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>No journal entries yet</p>
                  <button onClick={() => setActiveView('new')} style={{ ...styles.button, width: 'auto', padding: '0.5rem 1.5rem' }}>
                    Create Your First Entry
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {entries.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                            {entry.title}
                          </h3>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                            {new Date(entry.createdAt).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEditEntry(entry)}
                            style={{
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#6366f1',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.6rem',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            style={{
                              backgroundColor: 'rgba(255, 69, 58, 0.1)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ff453a',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.6rem',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                        {entry.content.length > 200 ? entry.content.substring(0, 200) + '...' : entry.content}
                      </p>
                      {entry.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {entry.tags.map(tag => (
                            <span key={tag} style={{
                              padding: '0.2rem 0.5rem',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              borderRadius: '4px',
                              fontSize: '0.55rem',
                              color: '#a5b4fc',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New/Edit Entry View */}
          {activeView === 'new' && (
            <div className="new-entry-view" style={{ animation: 'fadeIn 0.3s ease', maxWidth: '600px' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
              }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                  {selectedEntry ? 'Edit Entry' : 'New Journal Entry'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Title */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 500 }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Entry title..."
                      style={{ ...styles.input, width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 500 }}>
                      Content *
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your thoughts..."
                      style={{
                        ...styles.textarea,
                        width: '100%',
                        minHeight: '150px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        padding: '0.65rem 0.75rem',
                        fontSize: '0.75rem',
                        lineHeight: 1.5,
                      }}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 500 }}>
                      Tags
                    </label>
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                        {tags.map(tag => (
                          <div key={tag} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                          }}>
                            <span>{tag}</span>
                            <button
                              onClick={() => setTags(tags.filter(t => t !== tag))}
                              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.8rem', padding: 0, lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="Add a tag..."
                        style={{ ...styles.input, flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}
                      />
                      <button onClick={handleAddTag} style={{ ...styles.button, width: 'auto', padding: '0.5rem 1rem', fontSize: '0.65rem' }}>
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={selectedEntry ? handleUpdateEntry : handleAddEntry}
                      disabled={!title.trim() || !content.trim()}
                      style={{
                        ...styles.button,
                        backgroundColor: 'var(--primary-color)',
                        flex: 1,
                        opacity: (!title.trim() || !content.trim()) ? 0.5 : 1,
                        cursor: (!title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
                        padding: '0.6rem 1rem',
                        fontSize: '0.7rem',
                      }}
                    >
                      {selectedEntry ? 'Update Entry' : 'Save Entry'}
                    </button>
                    {selectedEntry && (
                      <button
                        onClick={() => { resetForm(); setActiveView('entries'); }}
                        style={{
                          ...styles.button,
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          flex: 1,
                          padding: '0.6rem 1rem',
                          fontSize: '0.7rem',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CSS Animations */}
        <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </div>
    </>
  );
};
