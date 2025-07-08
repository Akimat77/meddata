// frontend/src/components/RemindersPage.tsx

import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import styles from './RemindersPage.module.css';

// Вспомогательная функция для форматирования дней недели
const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Каждый день';
    if (days.length === 0) return 'Однократно';
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return days.sort((a,b) => a - b).map(d => dayNames[d]).join(', ');
};

// --- 1. ОБНОВЛЯЕМ ИНТЕРФЕЙС СВОЙСТВ ---
interface RemindersPageProps {
    token: string;
    prefilledTitle: string | null;
    onTitleConsumed: () => void;
}

// 2. ПРИНИМАЕМ НОВЫЕ СВОЙСТВА ---
export const RemindersPage: React.FC<RemindersPageProps> = ({ token, prefilledTitle, onTitleConsumed }) => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('09:00');
    const [days, setDays] = useState<Set<number>>(new Set([0,1,2,3,4,5,6]));

    const fetchReminders = async () => {
        // Убрали setLoading(true) отсюда, чтобы список не мигал при добавлении
        try {
            const response = await fetch('http://127.0.0.1:8000/reminders/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Не удалось загрузить напоминания');
            setReminders(await response.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReminders();
    }, [token]);

    // --- 3. НОВЫЙ useEffect ДЛЯ ПРЕДЗАПОЛНЕНИЯ ФОРМЫ ---
    useEffect(() => {
        if (prefilledTitle) {
            setTitle(`Принять ${prefilledTitle}`); // Автоматически заполняем поле
            onTitleConsumed(); // Сообщаем "наверх", что мы использовали значение
        }
    }, [prefilledTitle, onTitleConsumed]);


    const handleDayToggle = (dayIndex: number) => {
        const newDays = new Set(days);
        if (newDays.has(dayIndex)) {
            newDays.delete(dayIndex);
        } else {
            newDays.add(dayIndex);
        }
        setDays(newDays);
    };

    const handleAddReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !time) {
            alert('Пожалуйста, введите название и время');
            return;
        }
        try {
            const response = await fetch('http://127.0.0.1:8000/reminders/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, time, days_of_week: Array.from(days).sort((a,b) => a - b), is_active: true })
            });
            if (!response.ok) throw new Error('Ошибка при создании');
            setTitle(''); // Очищаем форму
            fetchReminders(); // Обновляем список
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Удалить это напоминание?')) {
            try {
                await fetch(`http://127.0.0.1:8000/reminders/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchReminders(); // Обновляем список
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (loading) return <p>Загрузка напоминаний...</p>;

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h3>Новое напоминание</h3>
                <form onSubmit={handleAddReminder}>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Название (напр. Выпить витамин D)" 
                        className={styles.input}
                        required
                    />
                    <div className={styles.timeAndDays}>
                        <input 
                            type="time" 
                            value={time} 
                            onChange={e => setTime(e.target.value)} 
                            className={styles.input}
                            required
                        />
                        <div className={styles.daySelector}>
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                                <button 
                                    type="button" 
                                    key={index} 
                                    onClick={() => handleDayToggle(index)}
                                    className={`${styles.dayButton} ${days.has(index) ? styles.active : ''}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="button button-primary">+ Добавить</button>
                </form>
            </div>

            <div className={styles.listCard}>
                <h3>Ваши напоминания</h3>
                <ul className={styles.reminderList}>
                    {reminders.map(r => (
                        <li key={r.id} className={styles.reminderItem}>
                            <div className={styles.time}>{r.time.substring(0, 5)}</div>
                            <div className={styles.details}>
                                <span className={styles.title}>{r.title}</span>
                                <span className={styles.days}>{formatDays(r.days_of_week)}</span>
                            </div>
                            <button onClick={() => handleDelete(r.id)} className={styles.deleteButton}>🗑️</button>
                        </li>
                    ))}
                </ul>
                {reminders.length === 0 && <p>У вас пока нет напоминаний.</p>}
            </div>
        </div>
    );
};