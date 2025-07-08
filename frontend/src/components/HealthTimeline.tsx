// frontend/src/components/HealthTimeline.tsx

import React from 'react';
import { Record } from '../types';
import { RecordCard } from './RecordCard';
import styles from './HealthTimeline.module.css';

interface HealthTimelineProps {
  records: Record[];
  onEdit: (record: Record) => void;
  onDelete: (recordId: number) => void;
  token: string;
  onCreateReminder: (medicationName: string) => void;
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({ records, onEdit, onDelete, token, onCreateReminder }) => {
  if (records.length === 0) {
    return <p>История болезни пока пуста. Добавьте первую запись, чтобы начать.</p>;
  }
  
  return (
    <ul className={styles.timeline}>
      {records.map((record) => (
        <RecordCard 
          key={record.id} 
          record={record} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          token={token}
          onCreateReminder={onCreateReminder}
        />
      ))}
    </ul>
  );
};