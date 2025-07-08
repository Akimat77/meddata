// frontend/src/components/LoginPage.tsx

import React, { useState } from 'react';
import styles from './LoginPage.module.css';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        try {
            const response = await fetch('http://127.0.0.1:8000/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Неверный email или пароль');
            }
            const data = await response.json();
            onLoginSuccess(data.access_token);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Вход в MedData.KZ</h2>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    {/* --- ВОТ ЭТА ПОДПИСЬ, КОТОРОЙ НЕ ХВАТАЕТ --- */}
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    {/* --- И ВОТ ЭТА ПОДПИСЬ --- */}
                    <label htmlFor="password">Пароль</label>
                    <input
                        id="password"
                        type="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <button type="submit" disabled={isSubmitting} className={styles.button}>
                    {isSubmitting ? 'Вход...' : 'Войти'}
                </button>
            </form>
            <p className={styles.switchView}>
                Еще нет аккаунта?{' '}
                <span onClick={onNavigateToRegister} className={styles.switchLink}>
                    Зарегистрироваться
                </span>
            </p>
        </div>
    );
};