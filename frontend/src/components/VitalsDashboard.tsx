// frontend/src/components/VitalsDashboard.tsx

import React, { useState, useEffect } from 'react';
import { VitalsRecord } from '../types';
import styles from './VitalsDashboard.module.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VitalsDashboardProps {
  token: string;
}

export const VitalsDashboard: React.FC<VitalsDashboardProps> = ({ token }) => {
  const [vitals, setVitals] = useState<VitalsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для полей новой записи
  const [type, setType] = useState('blood_sugar');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('ммоль/л');

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/vitals/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            // Сортируем данные по дате, чтобы график был правильным
            const sortedData = data.sort((a: VitalsRecord, b: VitalsRecord) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setVitals(sortedData);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchVitals();
  }, [token]);
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setType(newType);
    if (newType === 'blood_sugar') setUnit('ммоль/л');
    else if (newType === 'heart_rate') setUnit('уд/мин');
    else setUnit('мм рт.ст.');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return; // Не отправлять пустые значения
    try {
      const response = await fetch('http://127.0.0.1:8000/vitals/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, value: parseFloat(value), unit })
      });
      if (response.ok) {
        const newVital = await response.json();
        // Добавляем новый замер и снова сортируем
        setVitals(prevVitals => [...prevVitals, newVital].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        setValue('');
      } else {
        alert('Ошибка сохранения замера');
      }
    } catch (e) { console.error(e); }
  }

  // Готовим данные для графика
  const chartData = {
    labels: vitals
      .filter(v => v.type === type)
      .map(v => new Date(v.timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: `Динамика по показателю`,
        data: vitals
          .filter(v => v.type === type)
          .map(v => v.value),
        fill: true,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderColor: 'rgb(0, 122, 255)',
        tension: 0.2,
      },
    ],
  };

  if (loading) return <p>Загрузка данных мониторинга...</p>;

  return (
    <div className={styles.container}>
      {/* --- ВОЗВРАЩАЕМ ФОРМУ НА МЕСТО --- */}
      <div className={styles.formCard}>
        <h3>Добавить новый замер</h3>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Тип показателя</label>
            <select value={type} onChange={handleTypeChange} className={styles.select}>
              <option value="blood_sugar">Сахар крови</option>
              <option value="heart_rate">Пульс</option>
              <option value="blood_pressure_sys">Давление (систолическое)</option>
              <option value="blood_pressure_dia">Давление (диастолическое)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Значение</label>
            <input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} required className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label>Ед. изм.</label>
            <input type="text" value={unit} disabled className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <button type="submit" className={styles.button}>Добавить</button>
          </div>
        </form>
      </div>

      {/* --- ГРАФИК ОСТАЕТСЯ ЗДЕСЬ --- */}
      <div className={styles.chartCard}>
        <h3>График динамики</h3>
        <p>Отображается показатель: <strong>{type}</strong></p>
        <Line data={chartData} />
      </div>

      {/* --- ВОЗВРАЩАЕМ ТАБЛИЦУ НА МЕСТО --- */}
      <div className={styles.historyCard}>
        <h3>История замеров</h3>
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Дата и время</th>
              <th>Тип показателя</th>
              <th>Значение</th>
            </tr>
          </thead>
          <tbody>
            {[...vitals].reverse().map(vital => ( // .reverse() чтобы показать последние замеры наверху
              <tr key={vital.id}>
                <td>{new Date(vital.timestamp).toLocaleString('ru-RU')}</td>
                <td>{vital.type}</td>
                <td>{vital.value} {vital.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};