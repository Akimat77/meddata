// frontend/src/components/CoursesPage.tsx
import React, { useState, useEffect } from 'react';
import { TreatmentCourse, Record, Complaint } from '../types';
import styles from './CoursesPage.module.css';

// Вспомогательный компонент для отображения детализации
const CourseDetails = ({ course }: { course: TreatmentCourse }) => (
    <div className={styles.detailView}>
        <h4>Жалобы в рамках курса ({course.complaints.length})</h4>
        {course.complaints.length > 0 ? (
            <ul className={styles.detailList}>
                {course.complaints.map(c => <li key={c.id}>{c.complaint_text}</li>)}
            </ul>
        ) : <p>Нет жалоб, связанных с этим курсом.</p>}

        <h4 style={{ marginTop: '1.5rem' }}>Записи в ленте ({course.records.length})</h4>
        {course.records.length > 0 ? (
            <ul className={styles.detailList}>
                {course.records.map(r => (
                    <li key={r.id}>
                        {r.resource_type === 'Encounter' ? 'Визит: ' : 'Анализ: '}
                        {r.resource_type === 'Encounter' ? r.conclusion_text : r.test_name}
                        ({new Date(r.date).toLocaleDateString('ru-RU')})
                    </li>
                ))}
            </ul>
        ) : <p>Нет записей, связанных с этим курсом.</p>}
    </div>
);

export const CoursesPage: React.FC<{ token: string }> = ({ token }) => {
    const [courses, setCourses] = useState<TreatmentCourse[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<TreatmentCourse | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Состояния для формы
    const [courseName, setCourseName] = useState('');
    const [startDate, setStartDate] = useState('');

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://127.0.0.1:8000/courses/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => {
        if(token) fetchCourses();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://127.0.0.1:8000/courses/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: courseName, start_date: startDate || null, status: 'active' })
            });
            if (response.ok) {
                setCourseName('');
                setStartDate('');
                fetchCourses(); // Обновляем список курсов
            } else {
                alert('Ошибка при создании курса');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <p>Загрузка курсов лечения...</p>;

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Создать или выбрать курс</h3>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="courseName">Название нового курса</label>
                            <input
                                type="text"
                                id="courseName"
                                value={courseName}
                                onChange={e => setCourseName(e.target.value)}
                                placeholder="Напр. Химиотерапия FOLFOX"
                                required
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="startDate">Дата начала (необязательно)</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <button type="submit" className="button button-primary" style={{width: '100%'}}>
                            + Создать курс
                        </button>
                    </form>
                    <ul className={styles.courseList}>
                        {courses.map(c => (
                            <li key={c.id} className={`${styles.courseItem} ${selectedCourse?.id === c.id ? styles.active : ''}`} onClick={() => setSelectedCourse(c)}>
                                <p className={styles.courseName}>{c.name}</p>
                                <p className={styles.courseMeta}>Статус: {c.status} | Начало: {c.start_date ? new Date(c.start_date).toLocaleDateString('ru-RU') : '—'}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={styles.card}>
                    <h3>Детали курса: {selectedCourse ? `"${selectedCourse.name}"` : ''}</h3>
                    {selectedCourse ? (
                        <CourseDetails course={selectedCourse} />
                    ) : (
                        <p>Выберите курс из списка слева, чтобы увидеть его детали, включая связанные записи и жалобы.</p>
                    )}
                </div>
            </div>
        </div>
    );
};