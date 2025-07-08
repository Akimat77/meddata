// frontend/src/components/DoctorViewPage.tsx
import React, { useState, useEffect } from 'react';
import { Profile, Record, VitalsRecord } from '../types'; // Импортируем все наши типы
import styles from './DoctorViewPage.module.css';

// Эта страница будет принимать временный токен в качестве свойства
interface DoctorViewPageProps {
  token: string;
}

// Внутренний компонент для отображения карточки профиля
const ProfileCard = ({ profile }: { profile: Profile }) => (
    <div>
        <h3 className={styles.sectionTitle}>Паспорт здоровья</h3>
        {/* Здесь можно будет красиво отобразить данные профиля */}
        <p><strong>Рост:</strong> {profile.height || '—'} см</p>
        <p><strong>Вес:</strong> {profile.weight || '—'} кг</p>
    </div>
);

export const DoctorViewPage: React.FC<DoctorViewPageProps> = ({ token }) => {
  const [data, setData] = useState<{ profile: Profile; records: Record[]; vitals: VitalsRecord[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/share/view/${token}`);
        if (!response.ok) {
          throw new Error('Ссылка недействительна или срок ее действия истек.');
        }
        setData(await response.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <p>Загрузка данных пациента...</p>;
  if (error) return <div className={styles.container}><p style={{ color: 'red' }}>{error}</p></div>;
  if (!data) return <div className={styles.container}><p>Нет данных для отображения.</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Медицинская карта пациента</h2>
        <p>Предоставлено через сервис MedData.KZ (только для чтения)</p>
      </div>

      <ProfileCard profile={data.profile} />

      <div>
        <h3 className={styles.sectionTitle}>История записей</h3>
        {data.records.map(record => (
            <div key={record.id} style={{border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', borderRadius: '8px'}}>
                <p><strong>Дата:</strong> {new Date(record.date).toLocaleDateString()}</p>
                <p><strong>Тип:</strong> {record.resource_type === 'Encounter' ? 'Визит к врачу' : 'Анализ'}</p>
                <p><strong>Врач:</strong> {record.doctor_name || '—'}</p>
                <p><strong>Заключение:</strong> {record.conclusion_text || '—'}</p>
            </div>
        ))}
      </div>
    </div>
  );
};