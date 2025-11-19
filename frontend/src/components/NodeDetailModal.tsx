import React, { useState, useEffect, useMemo } from 'react';
import type { Node, GraphLink, NodeType, ConnectMode } from '../types';
import { badgeColors, nodeTypes } from '../types';
import { styles } from '../styles/styles';
import { getLinkId } from '../utils/helpers';
import * as api from '../services/api';

interface NodeDetailModalProps {
  node: Node;
  nodes: Node[];
  links: GraphLink[];
  onClose: () => void;
  setLinks: React.Dispatch<React.SetStateAction<GraphLink[]>>;
  setConnectMode: (mode: ConnectMode) => void;
  onUpdateNode: (updatedNode: Node) => void;
  onDeleteNode: (nodeId: string) => void;
}

/**
 * Modal for editing node details, managing connections, and deleting nodes
 */
export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  nodes,
  links,
  onClose,
  setLinks,
  setConnectMode,
  onUpdateNode,
  onDeleteNode
}) => {
  const [editedTitle, setEditedTitle] = useState(node.title);
  const [editedSummary, setEditedSummary] = useState(node.summary);
  const [editedType, setEditedType] = useState<NodeType>(node.type);
  const [editedColor, setEditedColor] = useState(node.color || badgeColors[node.type]);
  const [editedCompleted, setEditedCompleted] = useState(node.completed || false);

  useEffect(() => {
    setEditedTitle(node.title);
    setEditedSummary(node.summary);
    setEditedType(node.type);
    setEditedColor(node.color || badgeColors[node.type]);
    setEditedCompleted(node.completed || false);
  }, [node]);

  const hasChanges = useMemo(() => {
    const currentColor = node.color || badgeColors[node.type];
    return (
      editedTitle !== node.title ||
      editedSummary !== node.summary ||
      editedType !== node.type ||
      editedColor !== currentColor ||
      editedCompleted !== (node.completed || false)
    );
  }, [node, editedTitle, editedSummary, editedType, editedColor, editedCompleted]);

  const connectedNodes = useMemo(() => {
    return links
      .filter(l => getLinkId(l.source) === node.id || getLinkId(l.target) === node.id)
      .map(l => {
        const connectedId = getLinkId(l.source) === node.id ? getLinkId(l.target) : getLinkId(l.source);
        return nodes.find(n => n.id === connectedId);
      })
      .filter((n): n is Node => !!n);
  }, [node, links, nodes]);

  const handleDisconnect = async (targetId: string) => {
    try {
      // Find the link object to get its database ID
      const linkToDelete = links.find(l => 
        (getLinkId(l.source) === node.id && getLinkId(l.target) === targetId) ||
        (getLinkId(l.source) === targetId && getLinkId(l.target) === node.id)
      );
      
      if (!linkToDelete) {
        console.error('Link not found in local state');
        return;
      }

      console.log('Deleting link:', linkToDelete);
      const linkId = linkToDelete.id;
      
      if (!linkId) {
        console.error('Link has no ID:', linkToDelete);
        return;
      }

      await api.deleteLink(linkId);
      
      setLinks(prev =>
        prev.filter(
          (l: GraphLink) =>
            !(
              (getLinkId(l.source) === node.id && getLinkId(l.target) === targetId) ||
              (getLinkId(l.source) === targetId && getLinkId(l.target) === node.id)
            )
        )
      );
      console.log('Link deleted successfully');
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleSaveChanges = (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChanges) return;
    onUpdateNode({
      ...node,
      title: editedTitle,
      summary: editedSummary,
      type: editedType,
      color: editedColor,
      completed: editedCompleted,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${node.title}"? This cannot be undone.`)) {
      onDeleteNode(node.id);
      onClose();
    }
  };

  const handleStartConnect = () => {
    setConnectMode({ active: true, source: node.id });
    onClose();
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          aria-label="Close node details"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <header
          style={{
            ...styles.header,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h1 style={{ ...styles.h1, fontSize: '2rem' }}>Edit Node</h1>
        </header>
        <form
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            overflowY: 'auto',
            paddingRight: '1rem',
          }}
          onSubmit={handleSaveChanges}
        >
          <div>
            <label htmlFor="node-title" style={styles.label}>
              Title
            </label>
            <input
              id="node-title"
              type="text"
              style={{ ...styles.futuristicFormElement, ...styles.input }}
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="node-type" style={styles.label}>
              Type
            </label>
            <select
              id="node-type"
              style={{ ...styles.futuristicFormElement, ...styles.select }}
              value={editedType}
              onChange={e => setEditedType(e.target.value as NodeType)}
            >
              {nodeTypes.map(type => (
                <option key={type} value={type} style={{ backgroundColor: '#2d2d30', color: '#ffffff', padding: '0.5rem' }}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="node-color" style={styles.label}>
              Color
            </label>
            <input
              id="node-color"
              type="color"
              style={{
                ...styles.futuristicFormElement,
                ...styles.input,
                padding: '0.25rem 0.5rem',
                height: '40px',
                cursor: 'pointer',
              }}
              value={editedColor}
              onChange={e => setEditedColor(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="node-summary" style={styles.label}>
              Summary
            </label>
            <textarea
              id="node-summary"
              style={{ ...styles.futuristicFormElement, ...styles.textarea }}
              value={editedSummary}
              onChange={e => setEditedSummary(e.target.value)}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: editedCompleted ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${editedCompleted ? 'rgba(52, 199, 89, 0.3)' : 'var(--border-color)'}`,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setEditedCompleted(!editedCompleted)}
          >
            <input
              type="checkbox"
              checked={editedCompleted}
              onChange={(e) => setEditedCompleted(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: '#34C759',
              }}
            />
            <div>
              <label style={{...styles.label, marginBottom: '0.25rem', cursor: 'pointer'}}>
                Mark as Completed
              </label>
              <p style={{...styles.p, fontSize: '0.85rem', margin: 0, color: 'var(--text-tertiary)'}}>
                {editedCompleted ? 'Node is marked as done and will appear greyed out' : 'Click to mark this node as completed'}
              </p>
            </div>
          </div>

          {node.url && (
            <a href={node.url} target="_blank" rel="noopener noreferrer" style={styles.nodeLink}>
              {node.url}
            </a>
          )}

          {connectedNodes.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ ...styles.nodeTitle, fontSize: '1.2rem', marginBottom: '1rem' }}>
                Connections
              </h4>
              <ul style={styles.connectionsList}>
                {connectedNodes.map(connectedNode => (
                  <li key={connectedNode.id} style={styles.futuristicConnectionItem}>
                    <span style={{ color: 'var(--text-primary)' }}>{connectedNode.title}</span>
                    <button
                      type="button"
                      style={styles.futuristicDisconnectButton}
                      onClick={() => handleDisconnect(connectedNode.id)}
                    >
                      Disconnect
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="submit"
              style={{
                ...styles.futuristicButton,
                ...styles.futuristicPrimary,
                ...(!hasChanges ? styles.buttonDisabled : {}),
              }}
              disabled={!hasChanges}
            >
              Save Changes
            </button>
            <button
              type="button"
              style={{ ...styles.futuristicButton, ...styles.futuristicSecondary }}
              onClick={handleStartConnect}
            >
              Start Connection
            </button>
            <button
              type="button"
              style={{ ...styles.futuristicButton, ...styles.futuristicDanger }}
              onClick={handleDelete}
            >
              Delete Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
