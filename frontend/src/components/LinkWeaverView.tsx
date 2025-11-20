import React, { useState } from 'react';
import type { Node } from '../types';
import { styles } from '../styles/styles';

interface LinkWeaverViewProps {
  nodes: Node[];
  onAddNode: (title: string, summary: string, url: string) => void;
}

/**
 * Link Weaver - Paste URLs to automatically create Link nodes
 */
export const LinkWeaverView: React.FC<LinkWeaverViewProps> = ({ nodes, onAddNode }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  // Filter to show only Link-type nodes
  const linkNodes = nodes.filter(node => node.type === 'Link');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    onAddNode(title, summary, url);
    
    // Reset form
    setUrl('');
    setTitle('');
    setSummary('');
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div style={{ paddingLeft: '2.65rem', paddingRight: '1.35rem', paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{...styles.header, marginTop: 0, paddingTop: 0, marginBottom: '1.35rem', textAlign: 'left' }}>
        <h1 style={{...styles.h1, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{color: 'var(--primary-color)'}}
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Link Weaver
        </h1>
        <p style={styles.p}>Create knowledge nodes from URLs</p>
      </header>

      {/* URL Input Form */}
      <div style={{
        width: '470px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '1.35rem',
        marginTop: '1.35rem',
      }}>
        <h2 style={{ ...styles.nodeTitle, marginBottom: '1rem' }}>Add New Link</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="url" 
              style={{ 
                display: 'block', 
                marginBottom: '0.35rem',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 500
              }}
            >
              URL *
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              style={{
                ...styles.input,
                width: '100%',
                fontSize: '0.75rem',
              }}
              required
            />
            {url && !isValidUrl(url) && (
              <p style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.35rem' }}>
                Please enter a valid URL
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="title" 
              style={{ 
                display: 'block', 
                marginBottom: '0.35rem',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 500
              }}
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this resource"
              style={{
                ...styles.input,
                width: '100%',
                fontSize: '0.75rem',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="summary" 
              style={{ 
                display: 'block', 
                marginBottom: '0.35rem',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 500
              }}
            >
              Summary (optional)
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description or key takeaways..."
              style={{
                ...styles.textarea,
                width: '100%',
                minHeight: '67px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!url.trim() || !title.trim() || !isValidUrl(url)}
            style={{
              ...styles.futuristicButton,
              ...styles.futuristicPrimary,
              width: '100%',
              fontSize: '0.75rem',
              ...(!url.trim() || !title.trim() || !isValidUrl(url) ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ marginRight: '0.35rem', verticalAlign: 'middle' }}
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Link Node
          </button>
        </form>
      </div>

      {/* Link Nodes List - Fixed Right Side */}
      <div style={{
        position: 'fixed',
        right: '1.35rem',
        top: '4rem',
        bottom: '1.35rem',
        width: '270px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {linkNodes.length > 0 ? (
          <>
            <h2 style={{ ...styles.nodeTitle, marginBottom: '1rem', flexShrink: 0 }}>
              Your Link Nodes ({linkNodes.length})
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              overflowY: 'auto',
              paddingRight: '0.35rem',
              flex: 1,
            }}>
            {linkNodes.map((node) => (
              <div
                key={node.id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    ...styles.nodeTitle,
                    fontSize: '0.75rem',
                    marginBottom: node.summary ? '0.35rem' : '0',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {node.title}
                  </h3>
                  
                  {node.summary && (
                    <p style={{
                      ...styles.p,
                      fontSize: '0.65rem',
                      margin: 0,
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {node.summary}
                    </p>
                  )}
                </div>

                {node.url && (
                  <a
                    href={node.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#6366f1',
                      textDecoration: 'none',
                      fontSize: '0.65rem',
                      flexShrink: 0,
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
                      e.currentTarget.style.color = '#818cf8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                      e.currentTarget.style.color = '#6366f1';
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="11" 
                      height="11" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Visit Link
                  </a>
                )}
              </div>
            ))}
            </div>
          </>
        ) : (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="43" 
              height="43" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ 
                margin: '0 auto 1rem',
                opacity: 0.3,
                color: 'var(--text-secondary)',
              }}
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <h3 style={{ ...styles.nodeTitle, marginBottom: '0.5rem', opacity: 0.6 }}>
              No link nodes yet
            </h3>
            <p style={{ ...styles.p, opacity: 0.5 }}>
              Paste a URL above to create your first link node
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
