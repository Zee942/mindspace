import React, { useState, useEffect, useMemo, useRef } from 'react';
import { styles } from '../styles/styles';
import type { JournalEntry } from '../types';
import * as api from '../services/api';

export const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarWidth, setCalendarWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 420;
    const stored = window.localStorage.getItem('journalCalendarWidth');
    return stored ? Number(stored) || 420 : 420;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [formHeight, setFormHeight] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = window.localStorage.getItem('journalFormHeight');
    return stored ? Number(stored) || 0 : 0;
  });
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const verticalResizeData = useRef({ startY: 0, startHeight: 0 });
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<string[]>([]);
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

  // Handle drag-to-resize for calendar panel
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const minWidth = 260;
      const maxWidth = Math.max(window.innerWidth * 0.5, 500);
      const newWidth = Math.min(Math.max(event.clientX - 260, minWidth), maxWidth);
      setCalendarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      setIsResizing(false);
      try {
        window.localStorage.setItem('journalCalendarWidth', String(calendarWidth));
      } catch {
        // ignore storage errors
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, calendarWidth]);

  // Handle drag-to-resize for form height
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingHeight) return;
      const minHeight = 360;
      const maxHeight = Math.max(window.innerHeight - 220, minHeight + 40);
      const delta = event.clientY - verticalResizeData.current.startY;
      const nextHeight = Math.min(
        Math.max(verticalResizeData.current.startHeight + delta, minHeight),
        maxHeight,
      );
      setFormHeight(nextHeight);
    };

    const handleMouseUp = () => {
      if (!isResizingHeight) return;
      setIsResizingHeight(false);
      try {
        window.localStorage.setItem('journalFormHeight', String(formHeight || 0));
      } catch {
        // ignore storage errors
      }
    };

    if (isResizingHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingHeight, formHeight]);

  // Calendar calculations
  const monthStart = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [currentDate]);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const startDay = monthStart.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }
    
    // Add empty cells to fill 6 rows (42 total cells)
    while (days.length < 42) {
      days.push(null);
    }
    
    return days;
  }, [monthStart, monthEnd, currentDate]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach(entry => {
      const dateKey = new Date(entry.date).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
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
        date: new Date().toISOString(),
        photos: [...photos],
        voiceNotes: [...voiceNotes],
        tags: [...tags],
      });

      setEntries([newEntry, ...entries]);
      resetForm();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Failed to create journal entry');
    }
  };

  const handleUpdateEntry = async () => {
    if (!selectedEntry || !title.trim() || !content.trim()) return;

    try {
      const updatedEntry = await api.updateJournalEntry(selectedEntry.id, {
        title: title.trim(),
        content: content.trim(),
        photos,
        voiceNotes,
        tags,
      });

      setEntries(entries.map(entry => 
        entry.id === selectedEntry.id ? updatedEntry : entry
      ));
      resetForm();
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      alert('Failed to update journal entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await api.deleteJournalEntry(id);
      setEntries(entries.filter(entry => entry.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      alert('Failed to delete journal entry');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPhotos([]);
    setVoiceNotes([]);
    setTags([]);
    setCurrentTag('');
    setSelectedEntry(null);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setPhotos([...entry.photos]);
    setVoiceNotes([...entry.voiceNotes]);
    setTags([...entry.tags]);
  };

  const handleAddPhoto = () => {
    const url = prompt('Enter photo URL:');
    if (url && url.trim()) {
      setPhotos([...photos, url.trim()]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleAddVoiceNote = () => {
    const url = prompt('Enter voice note URL:');
    if (url && url.trim()) {
      setVoiceNotes([...voiceNotes, url.trim()]);
    }
  };

  const handleRemoveVoiceNote = (index: number) => {
    setVoiceNotes(voiceNotes.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
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
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      padding: '0 1.35rem 1.35rem 1.35rem',
    }}>
      <header style={{...styles.header, marginBottom: '1.35rem', paddingTop: '0', marginTop: '0'}}>
        <h1 style={{...styles.h1, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary-color)'}}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Journal
        </h1>
        <p style={styles.p}>Capture your thoughts and track your journey</p>
      </header>

      <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minHeight: 0, width: '100%' }}>
        {/* Calendar Section */}
        <div style={{
          width: calendarWidth, 
          flexShrink: 0,
          backgroundColor: 'hsl(none 0% 100% / 0.03)',
          borderColor: 'hsl(none 0% 100% / 0.1)',
          borderStyle: 'solid',
          borderWidth: '0.8px',
          borderRadius: '14px',
          color: 'hsl(240 11% 96%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          overflow: 'hidden',
          alignSelf: 'flex-start',
        }}>
            {/* Calendar Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={goToPreviousMonth}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    padding: '0.35rem 0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    padding: '0.35rem 0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>

              <h2 style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {monthName}
              </h2>

              <button
                onClick={goToToday}
                style={{
                  ...styles.button,
                  width: 'auto',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.6rem',
                }}
              >
                Today
              </button>
            </div>

            {/* Weekday Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{
                  textAlign: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  padding: '0.15rem',
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(6, 1fr)',
              gap: '0.45rem',
              height: '360px',
              width: '100%',
            }}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} style={{ width: '100%', height: '100%' }} />;
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
                      backgroundColor: isSelected 
                        ? 'rgba(99, 102, 241, 0.2)' 
                        : isTodayDate 
                          ? 'rgba(99, 102, 241, 0.1)' 
                          : 'rgba(255,255,255,0.03)',
                      border: isSelected 
                        ? '1.35px solid #6366f1' 
                        : isTodayDate
                          ? '1.35px solid rgba(99, 102, 241, 0.4)'
                          : '0.7px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.15rem',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = isTodayDate ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: isTodayDate ? 700 : 600,
                      color: isSelected || isTodayDate ? '#6366f1' : 'var(--text-primary)',
                    }}>
                      {date.getDate()}
                    </span>
                    {hasEntries && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        backgroundColor: 'rgba(99, 102, 241, 0.3)',
                        borderRadius: '10px',
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#a5b4fc',
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        {dateEntries.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
        </div>

        {/* Selected Date Entries Panel */}
        {selectedDate && selectedDateEntries.length > 0 && (
          <div style={{
            width: '300px',
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}>
            <div style={{
              backgroundColor: 'hsl(none 0% 100% / 0.03)',
              borderColor: 'hsl(none 0% 100% / 0.1)',
              borderStyle: 'solid',
              borderWidth: '0.8px',
              borderRadius: '14px',
              color: 'hsl(240 11% 96%)',
              padding: '16px',
              height: '490px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                paddingBottom: '0.65rem',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <h3 style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <span style={{
                  fontSize: '0.55rem',
                  color: '#a5b4fc',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}>
                  {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              
              <div style={{ 
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                paddingRight: '0.25rem',
              }}
              className="custom-scrollbar"
              >
                  {selectedDateEntries.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '0.6rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => handleEditEntry(entry)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.4rem' }}>
                        <h4 style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: 0,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: '0.5rem',
                        }}>
                          {entry.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff453a',
                            cursor: 'pointer',
                            fontSize: '0.55rem',
                            padding: '0.15rem 0.3rem',
                            borderRadius: '4px',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 69, 58, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Delete
                        </button>
                      </div>
                      
                      {/* Content Preview */}
                      <p style={{
                        fontSize: '0.55rem',
                        color: 'var(--text-secondary)',
                        margin: '0 0 0.4rem 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                      }}>
                        {entry.content}
                      </p>
                      
                      {/* Metadata Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {entry.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {entry.tags.slice(0, 2).map(tag => (
                              <span key={tag} style={{
                                padding: '0.15rem 0.4rem',
                                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                borderRadius: '3px',
                                fontSize: '0.5rem',
                                color: '#a5b4fc',
                              }}>
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 2 && (
                              <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)' }}>
                                +{entry.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        {entry.photos.length > 0 && (
                          <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            {entry.photos.length}
                          </span>
                        )}
                        {entry.voiceNotes.length > 0 && (
                          <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                            {entry.voiceNotes.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* New Entry Form */}
        <div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
          <div
            ref={formCardRef}
            style={{
            backgroundColor: 'hsl(none 0% 100% / 0.03)',
            borderColor: 'hsl(none 0% 100% / 0.1)',
            borderStyle: 'solid',
            borderWidth: '1.2px',
            borderRadius: '12px',
            color: 'hsl(240 11% 96%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 20px',
            height: formHeight ? `${formHeight}px` : 'auto',
            overflowY: 'auto',
            width: '100%',
          }}>
            <h2 style={{ ...styles.nodeTitle, marginBottom: '0.65rem', fontSize: '0.75rem', fontWeight: 600 }}>
              {selectedEntry ? 'Edit Entry' : 'New Journal Entry'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.55rem', fontWeight: 500 }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry title..."
                  style={{ ...styles.input, width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.65rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.55rem', fontWeight: 500 }}>
                  Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts..."
                  style={{
                    ...styles.textarea,
                    width: '100%',
                    minHeight: '120px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    padding: '0.5rem 0.6rem',
                    fontSize: '0.6rem',
                    lineHeight: '1.4',
                  }}
                />
              </div>

              {/* Tags Section */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.55rem', fontWeight: 500 }}>
                  Tags
                </label>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.45rem' }}>
                    {tags.map((tag) => (
                      <div key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.4rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '4px', fontSize: '0.52rem' }}>
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            padding: 0,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                    style={{ ...styles.input, flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.6rem' }}
                  />
                  <button onClick={handleAddTag} style={{ ...styles.button, width: 'auto', padding: '0.4rem 0.65rem', fontSize: '0.58rem' }}>
                    Add
                  </button>
                </div>
              </div>

              {/* Photos Section */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.55rem', fontWeight: 500 }}>
                  Photos
                </label>
                {photos.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.45rem' }}>
                    {photos.map((photo, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0.4rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo}</span>
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ff453a',
                            borderRadius: '4px',
                            padding: '0.2rem 0.4rem',
                            cursor: 'pointer',
                            fontSize: '0.5rem',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleAddPhoto}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.58rem',
                    padding: '0.4rem 0.6rem',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                >
                  + ADD PHOTO
                </button>
              </div>

              {/* Voice Notes Section */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.55rem', fontWeight: 500 }}>
                  Voice Notes
                </label>
                {voiceNotes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.45rem' }}>
                    {voiceNotes.map((note, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0.4rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note}</span>
                        <button
                          onClick={() => handleRemoveVoiceNote(index)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ff453a',
                            borderRadius: '4px',
                            padding: '0.2rem 0.4rem',
                            cursor: 'pointer',
                            fontSize: '0.5rem',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleAddVoiceNote}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.58rem',
                    padding: '0.4rem 0.6rem',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                >
                  + ADD VOICE NOTE
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={selectedEntry ? handleUpdateEntry : handleAddEntry}
                  disabled={!title.trim() || !content.trim()}
                  style={{
                    ...styles.button,
                    backgroundColor: 'var(--primary-color)',
                    flex: 1,
                    opacity: (!title.trim() || !content.trim()) ? 0.5 : 1,
                    cursor: (!title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.6rem',
                  }}
                >
                  {selectedEntry ? 'Update Entry' : 'Save Entry'}
                </button>
                {selectedEntry && (
                  <button
                    onClick={() => {
                      resetForm();
                    }}
                    style={{
                      ...styles.button,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      flex: 1,
                      padding: '0.45rem 0.8rem',
                      fontSize: '0.6rem',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
