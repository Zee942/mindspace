import React from 'react';
import { styles } from '../styles/styles';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  return (
    <div style={{
      ...styles.emptyStateContainer,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'auto'
    }}>
      <div style={styles.emptyStateIcon}>{icon}</div>
      <div>
        <h2 style={{ ...styles.h1, fontSize: '1.75rem', margin: 0 }}>{title}</h2>
        <p style={{ ...styles.p, maxWidth: '400px', marginTop: '0.75rem' }}>{message}</p>
      </div>
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
};
