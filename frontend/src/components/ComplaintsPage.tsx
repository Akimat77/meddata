// frontend/src/components/ComplaintsPage.tsx

import React, { useState, useEffect } from 'react';
import { Complaint } from '../types';
import styles from './ComplaintsPage.module.css';

export const ComplaintsPage: React.FC<{ token: string }> = ({ token }) => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [complaintText, setComplaintText] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComplaints = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/complaints/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setComplaints(await response.json());
            } else {
                console.error("Не удалось загрузить жалобы");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchComplaints();
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaintText.trim()) {
            alert("Пожалуйста, опишите вашу жалобу.");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/complaints/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ complaint_text: complaintText, start_date: startDate || null })
            });
            if (response.ok) {
                setComplaintText('');
                setStartDate('');
                fetchComplaints(); // Обновляем список после добавления
            } else {
                alert('Ошибка при добавлении жалобы');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) return <p>Загрузка жалоб...</p>;

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h3>Что вас беспокоит?</h3>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="complaint-text">Опишите ваше самочувствие или жалобу</label>
                        <textarea
                            id="complaint-text"
                            value={complaintText}
                            onChange={e => setComplaintText(e.target.value)}
                            placeholder="Например: Периодическая головная боль в затылке, усиливающаяся к вечеру..."
                            rows={5}
                            className={styles.textarea}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="start-date">Когда это началось? (необязательно)</label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <button type="submit" className="button button-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Сохранение...' : 'Добавить жалобу'}
                    </button>
                </form>
            </div>
            <div className={styles.listCard}>
                <h3>История жалоб</h3>
                <ul className={styles.complaintList}>
                    {complaints.length > 0 ? (
                        complaints.map(c => (
                            <li key={c.id} className={styles.complaintItem}>
                                <p className={styles.complaintText}>{c.complaint_text}</p>
                                <p className={styles.complaintMeta}>
                                    Началось: {c.start_date ? new Date(c.start_date).toLocaleDateString('ru-RU') : 'не указано'} | 
                                    Статус: <span className={`${styles.status} ${c.status === 'active' ? styles.statusActive : styles.statusResolved}`}>
                                        {c.status === 'active' ? 'Активна' : 'Решена'}
                                    </span>
                                </p>
                            </li>
                        ))
                    ) : (
                        <p>У вас пока нет зарегистрированных жалоб.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};