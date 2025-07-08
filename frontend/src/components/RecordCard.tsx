// frontend/src/components/RecordCard.tsx

import React from 'react';
import { Record } from '../types';
import styles from './RecordCard.module.css';

// 1. Убеждаемся, что интерфейс принимает все необходимые свойства, включая 'token'
interface RecordCardProps {
  record: Record;
  onEdit: (record: Record) => void;
  onDelete: (recordId: number) => void;
  token: string;
  onCreateReminder: (medicationName: string) => void;
}

const RecordIcon = ({ type }: { type: string }) => {
  const iconSVG = type === 'Encounter' 
    ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line></svg>;
  
  return <div className={styles.icon}>{iconSVG}</div>;
};

// 2. Убеждаемся, что компонент принимает все свойства
export const RecordCard: React.FC<RecordCardProps> = ({ record, onEdit, onDelete, token, onCreateReminder }) => {
  
  const attachmentFullUrl = record.attachment_url 
      ? `http://127.0.0.1:8000${record.attachment_url}` 
      : null;

  const handleDeleteClick = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись? Это действие необратимо.')) {
      onDelete(record.id);
    }
  };

  return (
    <li className={styles.record}>
      <RecordIcon type={record.resource_type} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h5>{record.resource_type === 'Encounter' ? 'Визит к врачу' : 'Результат анализа'}</h5>
          <div className={styles.controls}>
              <button onClick={() => onEdit(record)} title="Редактировать">✏️</button>
              <button onClick={handleDeleteClick} title="Удалить">🗑️</button>
          </div>
        </div>
        <div className={styles.body}>
          <p><strong>Дата:</strong> {new Date(record.date).toLocaleDateString('ru-RU')}</p>
          
          {record.resource_type === 'Encounter' ? (
            <>
              <p><strong>Врач:</strong> {record.doctor_name || 'Не указан'}</p>
              <p><strong>Клиника:</strong> {record.clinic_name || 'Не указана'}</p>
              {record.patient_complaints && <p><strong>Жалобы:</strong> {record.patient_complaints}</p>}
              {record.conclusion_text && <p><strong>Заключение:</strong> {record.conclusion_text}</p>}
              {record.diagnosis_code && <p><strong>Код диагноза:</strong> {record.diagnosis_code}</p>}
              {record.medication_name && <p><strong>Назначенный препарат:</strong> {record.medication_name}</p>}

              {record.medication_name && (
                <div style={{marginTop: '1rem'}}>
                    <button 
                        onClick={() => onCreateReminder(record.medication_name!)} 
                        className={styles.reminderButton}
                    >
                        + Создать напоминание о приеме
                    </button>
                </div>
              )}
            </>
          ) : (
            <>
              <p><strong>Лаборатория:</strong> {record.lab_name || 'Не указана'}</p>
              <p><strong>Название анализа:</strong> {record.test_name || 'Не указано'}</p>
              <p><strong>Результат:</strong> {record.result || '—'} <span className={styles.unit}>{record.reference_range ? `(Норма: ${record.reference_range})` : ''}</span></p>
            </>
          )}

          {attachmentFullUrl && (
            <p style={{ marginTop: '1rem' }}>
              <strong>Вложение:</strong>{' '}
              <a href={attachmentFullUrl} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color)', fontWeight: '600'}}>
                Посмотреть файл
              </a>
            </p>
          )}
        </div>
      </div>
    </li>
  );
};