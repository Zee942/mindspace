import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Skill, Node, GraphLink, NodeType } from '../types';
import { styles } from '../styles/styles';
import { EmptyState } from './EmptyState';
import { getLinkId } from '../utils/helpers';

const badgeColors: Record<NodeType, string> = {
  Task: '#34aadc',
  Skill: '#34d17d',
  Goal: '#ff9f0a',
  Link: '#bf5af2',
};

// --- SKILL CARD ---
const SkillCard: React.FC<{ skill: Skill, connectionCount: number }> = ({ skill, connectionCount }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        (card.firstChild as HTMLElement).style.opacity = '1';
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        
        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        (card.firstChild as HTMLElement).style.opacity = '0';
    };

    return (
        <div 
            ref={cardRef}
            style={styles.skillCard}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div style={styles.skillCardGlow} />
            <div>
                <h3 style={styles.skillCardTitle}>{skill.title}</h3>
                {skill.summary && <p style={styles.skillCardSummary}>{skill.summary.substring(0, 100)}{skill.summary.length > 100 ? '...' : ''}</p>}
            </div>
            <div style={styles.skillCardFooter}>
                 <div style={{display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'flex-start'}}>
                    <span>{connectionCount} Connections</span>
                    {skill.category && <span style={{...styles.taskCardSkillBadge, padding: '0.05rem 0.35rem', fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)'}}>{skill.category}</span>}
                </div>
                <span style={{color: skill.color || badgeColors['Skill']}}>● Skill</span>
            </div>
        </div>
    );
};

// --- ADD SKILL MODAL ---
const AddSkillModal: React.FC<{
  onClose: () => void;
  onCreate: (title: string, summary: string, category: string) => void;
}> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), summary.trim(), category.trim());
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <header style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div>
            <h1 style={{...styles.h1, fontSize: '1.35rem'}}>Add New Skill</h1>
            <p style={styles.p}>Define a new skill to track in your matrix.</p>
          </div>
          <button onClick={onClose} style={{...styles.navButton, color: 'var(--text-secondary)', background: 'none', border: 'none', backdropFilter: 'none'}} aria-label="Close add skill form">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label htmlFor="skill-title" style={styles.label}>Skill Title</label>
            <input
              id="skill-title"
              type="text"
              style={styles.input}
              placeholder="E.g., React.js"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="skill-category" style={styles.label}>Category</label>
            <input
              id="skill-category"
              type="text"
              style={styles.input}
              placeholder="E.g., Frontend Development"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="skill-summary" style={styles.label}>Summary</label>
            <textarea
              id="skill-summary"
              style={styles.textarea}
              placeholder="Add a short description (optional)..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.65rem' }}>
            <button type="button" onClick={onClose} style={{ ...styles.button, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)'}}>
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...styles.button, ...(!title.trim() ? styles.buttonDisabled : {}) }}
              disabled={!title.trim()}
            >
              Create Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- SKILL DETAIL VIEW ---
const SkillDetailView: React.FC<{
  skill: Skill;
  connections: Node[];
  isOnMap: boolean;
  onClose: () => void;
  onUpdateSkill: (updatedSkill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  onShareSkillToMap: (skill: Skill) => void;
}> = ({ skill, connections, isOnMap, onClose, onUpdateSkill, onDeleteSkill, onShareSkillToMap }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(skill.title);
    const [editedSummary, setEditedSummary] = useState(skill.summary);
    const [editedCategory, setEditedCategory] = useState(skill.category);

    useEffect(() => {
        setEditedTitle(skill.title);
        setEditedSummary(skill.summary);
        setEditedCategory(skill.category);
    }, [skill]);

    const handleSave = () => {
        onUpdateSkill({ ...skill, title: editedTitle.trim(), summary: editedSummary.trim(), category: editedCategory.trim() });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedTitle(skill.title);
        setEditedSummary(skill.summary);
        setEditedCategory(skill.category);
        setIsEditing(false);
    };

    const handleDelete = () => {
        onDeleteSkill(skill.id);
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateSkill({ ...skill, progress: parseInt(e.target.value, 10) });
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <header style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    {isEditing ? (
                        <div style={{width: '100%'}}>
                            <label htmlFor="edit-skill-title" style={styles.label}>Skill Title</label>
                            <input
                              id="edit-skill-title"
                              type="text"
                              style={{ ...styles.input, fontSize: '1.35rem', padding: '0.35rem' }}
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              autoFocus
                            />
                        </div>
                    ) : (
                        <div>
                            <h1 style={{...styles.h1, fontSize: '1.35rem'}}>{skill.title}</h1>
                            {skill.category && <p style={{...styles.p, color: 'var(--primary-color)', fontWeight: 500, marginTop: '-0.15rem', marginBottom: '0.35rem'}}>{skill.category}</p>}
                            <p style={styles.p}>{skill.summary}</p>
                        </div>
                    )}
                    <button onClick={onClose} style={{...styles.navButton, color: 'var(--text-secondary)', background: 'none', border: 'none', backdropFilter: 'none', marginLeft: '0.65rem', flexShrink: 0}} aria-label="Close skill details">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </header>

                {isEditing && (
                    <>
                        <div style={{width: '100%', marginTop: '-0.65rem'}}>
                            <label htmlFor="edit-skill-category" style={styles.label}>Category</label>
                            <input
                              id="edit-skill-category"
                              type="text"
                              style={styles.input}
                              value={editedCategory}
                              onChange={(e) => setEditedCategory(e.target.value)}
                            />
                        </div>
                        <div style={{width: '100%'}}>
                            <label htmlFor="edit-skill-summary" style={styles.label}>Summary</label>
                            <textarea
                              id="edit-skill-summary"
                              style={styles.textarea}
                              value={editedSummary}
                              onChange={(e) => setEditedSummary(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div style={styles.progressContainer}>
                    <div style={styles.progressBarLabel}>
                        <label style={styles.label}>Proficiency</label>
                        <span style={{color: 'var(--secondary-color)', fontWeight: 600, fontSize: '0.7rem'}}>{skill.progress || 0}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={skill.progress || 0}
                        onChange={handleProgressChange}
                        style={{
                            width: '100%',
                            accentColor: 'var(--secondary-color)',
                            cursor: 'pointer'
                        }}
                    />
                </div>
                
                 {connections.length > 0 && (
                    <div>
                        <h4 style={{...styles.nodeTitle, fontSize: '0.8rem', marginBottom: '0.65rem'}}>Connections on Map</h4>
                        <ul style={{...styles.connectionsList, gap: '0.5rem'}}>
                            {connections.map(connectedNode => (
                                <li key={connectedNode.id} style={{...styles.futuristicConnectionItem, backgroundColor: 'rgba(160, 102, 255, 0.08)', borderColor: 'rgba(160, 102, 255, 0.2)'}}>
                                    <span style={{color: 'var(--text-primary)'}}>{connectedNode.title}</span>
                                    <span style={{
                                        color: connectedNode.color || badgeColors[connectedNode.type],
                                        fontSize: '0.55rem',
                                        fontWeight: 500
                                    }}>● {connectedNode.type}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {isEditing ? (
                     <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.65rem' }}>
                        <button onClick={handleCancel} style={{ ...styles.button, backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)'}}>
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          style={{ ...styles.button, ...(!editedTitle.trim() ? styles.buttonDisabled : {}) }}
                          disabled={!editedTitle.trim()}
                        >
                          Save Changes
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            style={{...styles.button, ...styles.secondaryButton, ...(isOnMap ? styles.buttonDisabled : {})}}
                            onClick={() => onShareSkillToMap(skill)}
                            disabled={isOnMap}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            {isOnMap ? 'Shared to Map' : 'Share to Map'}
                        </button>
                        <button style={{...styles.button, backgroundColor: 'rgba(255,255,255,0.1)'}} onClick={() => setIsEditing(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                        </button>
                        <button style={{...styles.button, ...styles.dangerButtonLarge}} onClick={handleDelete}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- MAIN SKILLS VIEW COMPONENT ---
export const SkillsView: React.FC<{ 
    skills: Skill[],
    nodes: Node[],
    links: GraphLink[],
    setActiveTab: (tab: 'map' | 'dashboard' | 'action' | 'skills' | 'finance') => void;
    selectedSkillId: string | null;
    setSelectedSkillId: (id: string | null) => void;
    onAddSkill: (title: string, summary: string, category: string) => void;
    onUpdateSkill: (updatedSkill: Skill) => void;
    onDeleteSkill: (skillId: string) => void;
    onShareSkillToMap: (skill: Skill) => void;
}> = ({ skills, nodes, links, setActiveTab, selectedSkillId, setSelectedSkillId, onAddSkill, onUpdateSkill, onDeleteSkill, onShareSkillToMap }) => {
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = useMemo(() => {
        const uniqueCategories = new Set(skills.map(skill => skill.category).filter(Boolean));
        return ['All', ...Array.from(uniqueCategories)];
    }, [skills]);

    const filteredSkills = useMemo(() => {
        if (activeCategory === 'All') {
            return skills;
        }
        return skills.filter(skill => skill.category === activeCategory);
    }, [skills, activeCategory]);

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
    
    const selectedSkill = useMemo(() => {
        if (!selectedSkillId) return null;
        return skills.find(n => n.id === selectedSkillId);
    }, [selectedSkillId, skills]);

    const selectedSkillConnections = useMemo(() => {
        if (!selectedSkill) return [];
        const correspondingNodeId = `map-${selectedSkill.id}`;
        return links
            .filter(l => getLinkId(l.source) === correspondingNodeId || getLinkId(l.target) === correspondingNodeId)
            .map(l => {
                const connectedId = getLinkId(l.source) === correspondingNodeId ? getLinkId(l.target) : getLinkId(l.source);
                return nodes.find(n => n.id === connectedId);
            })
            .filter((n): n is Node => !!n);
    }, [selectedSkill, links, nodes]);
    
    const handleCreateSkill = (title: string, summary: string, category: string) => {
        onAddSkill(title, summary, category);
        setIsAddModalOpen(false);
    };

    if (skills.length === 0 && !isAddModalOpen) {
        return (
            <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"></path></svg>}
                title="Develop Your Skills"
                message="No skills have been added yet. Create your first skill to see it appear here as an interactive card."
                action={
                    <button style={{...styles.button, width: 'auto'}} onClick={() => setIsAddModalOpen(true)}>
                        + Add First Skill
                    </button>
                }
            />
        );
    }

    return (
        <div style={styles.skillsViewContainer}>
            <header style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.35rem'}}>
              <div>
                <h1 style={{...styles.h1, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary-color)'}}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"></path>
                  </svg>
                  Skills Matrix
                </h1>
                <p style={styles.p}>A dynamic visualization of your acquired skills. Hover over a card to interact.</p>
              </div>
              <button style={{...styles.button, width: 'auto', flexShrink: 0}} onClick={() => setIsAddModalOpen(true)}>
                + Add New Skill
              </button>
            </header>
            {categories.length > 1 && (
                <div style={{ 
                    display: 'flex', 
                    gap: '0.35rem', 
                    marginBottom: '1.35rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.35rem',
                    marginLeft: '0',
                }}>
                    {categories.map(category => (
                        <button
                            key={category}
                            style={{
                                backgroundColor: activeCategory === category ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                border: 'none',
                                borderRadius: '5px',
                                color: activeCategory === category ? '#6366f1' : 'var(--text-secondary)',
                                padding: '0.5rem 1rem',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            onClick={() => setActiveCategory(category)}
                            onMouseEnter={(e) => {
                                if (activeCategory !== category) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeCategory !== category) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}
            <div style={styles.skillsGrid}>
                {filteredSkills.map(skill => (
                    <div key={skill.id} onClick={() => setSelectedSkillId(skill.id)}>
                        <SkillCard 
                            skill={skill}
                            connectionCount={connectionCounts.get(`map-${skill.id}`) || 0}
                        />
                    </div>
                ))}
            </div>
            {selectedSkill && (
                <SkillDetailView
                    skill={selectedSkill}
                    connections={selectedSkillConnections}
                    isOnMap={nodes.some(n => n.id === `map-${selectedSkill.id}`)}
                    onClose={() => setSelectedSkillId(null)}
                    onUpdateSkill={onUpdateSkill}
                    onDeleteSkill={onDeleteSkill}
                    onShareSkillToMap={onShareSkillToMap}
                />
            )}
            {isAddModalOpen && (
                <AddSkillModal
                    onClose={() => setIsAddModalOpen(false)}
                    onCreate={handleCreateSkill}
                />
            )}
        </div>
    );
};
