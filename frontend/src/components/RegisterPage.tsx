// frontend/src/components/RegisterPage.tsx

import React, { useState, useEffect } from 'react';
import { Allergy, ChronicDisease } from '../types';
import styles from './RegisterPage.module.css';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [customAllergy, setCustomAllergy] = useState('');
    const [customDisease, setCustomDisease] = useState('');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [allergies, setAllergies] = useState<Allergy[]>([]);
    const [diseases, setDiseases] = useState<ChronicDisease[]>([]);
    const [selectedAllergyIds, setSelectedAllergyIds] = useState<Set<number>>(new Set());
    const [selectedDiseaseIds, setSelectedDiseaseIds] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [allergiesRes, diseasesRes] = await Promise.all([
                    fetch('http://127.0.0.1:8000/allergies/'),
                    fetch('http://127.0.0.1:8000/chronic-diseases/')
                ]);
                setAllergies(await allergiesRes.json());
                setDiseases(await diseasesRes.json());
            } catch (e) {
                setError("Не удалось загрузить справочники");
            }
        };
        fetchInitialData();
    }, []);
    
    const handleAllergyChange = (id: number) => {
        const newSelection = new Set(selectedAllergyIds);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedAllergyIds(newSelection);
    };

    const handleDiseaseChange = (id: number) => {
        const newSelection = new Set(selectedDiseaseIds);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedDiseaseIds(newSelection);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await fetch('http://127.0.0.1:8000/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    birth_date: birthDate,
                    allergy_ids: Array.from(selectedAllergyIds),
                    chronic_disease_ids: Array.from(selectedDiseaseIds),
                    custom_allergy: customAllergy,
                    custom_disease: customDisease // Отправляем и кастомное заболевание
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Произошла ошибка регистрации');
            }
            setSuccessMessage('Вы успешно зарегистрированы! Теперь вы можете войти в систему.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Регистрация в MedData.KZ</h2>
            <form onSubmit={handleSubmit}>
                <div className={styles.grid}>
                    <div className={styles.formGroup}><label htmlFor="firstName">Ваше имя</label><input id="firstName" type="text" className={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                    <div className={styles.formGroup}><label htmlFor="lastName">Ваша фамилия</label><input id="lastName" type="text" className={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                </div>
                <div className={styles.formGroup}><label htmlFor="birthDate">Дата рождения</label><input id="birthDate" type="date" className={styles.input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /></div>
                <div className={styles.formGroup}><label htmlFor="email">Email</label><input id="email" type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className={styles.formGroup}><label htmlFor="password">Пароль</label><input id="password" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <div className={styles.formGroup}><label htmlFor="confirmPassword">Подтвердите пароль</label><input id="confirmPassword" type="password" className={styles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>

                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Укажите, если у вас есть аллергия:</h4>
                    <div className={styles.checkboxGrid}>
                        {allergies.map(allergy => (
                            <label key={allergy.id} className={styles.checkboxLabel}><input type="checkbox" onChange={() => handleAllergyChange(allergy.id)} /> {allergy.name}</label>
                        ))}
                    </div>
                    <div className={styles.formGroup} style={{marginTop: '1rem'}}>
                        <label htmlFor="customAllergy">Другое (впишите, если нет в списке)</label>
                        <input id="customAllergy" type="text" placeholder="Например: Лактоза" className={styles.input} value={customAllergy} onChange={(e) => setCustomAllergy(e.target.value)} />
                    </div>
                </div>

                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Укажите, если у вас есть хронические заболевания:</h4>
                    <div className={styles.checkboxGrid}>
                        {diseases.map(disease => (
                            <label key={disease.id} className={styles.checkboxLabel}><input type="checkbox" onChange={() => handleDiseaseChange(disease.id)} /> {disease.name}</label>
                        ))}
                    </div>
                    {/* --- ВОТ НЕДОСТАЮЩИЙ БЛОК --- */}
                    <div className={styles.formGroup} style={{marginTop: '1rem'}}>
                        <label htmlFor="customDisease">Другое (впишите, если нет в списке)</label>
                        <input id="customDisease" type="text" placeholder="Например: Гастрит" className={styles.input} value={customDisease} onChange={(e) => setCustomDisease(e.target.value)} />
                    </div>
                </div>

                {successMessage && <p className={`${styles.message} ${styles.success}`}>{successMessage}</p>}
                {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
                <button type="submit" disabled={isSubmitting} className={styles.button}>{isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}</button>
            </form>
            <p className={styles.switchView}>Уже есть аккаунт?{' '}<span onClick={onNavigateToLogin} className={styles.switchLink}>Войти</span></p>
        </div>
    );
};