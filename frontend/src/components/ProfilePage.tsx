// frontend/src/components/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { Profile, User } from '../types';
import styles from './ProfilePage.module.css';

// Вспомогательный компонент для отображения строки данных
const ProfileDataRow = ({ label, name, value, unit, isEditMode, onChange, type = 'text' }: any) => {
    return (
        <div className={styles.dataRow}>
            <span className={styles.label}>{label}</span>
            {isEditMode ? (
                <input 
                    type={type} 
                    name={name} 
                    value={value || ''} 
                    onChange={onChange} 
                    className={styles.input} 
                />
            ) : (
                <span className={styles.value}>
                    {value || '—'}
                    {value && unit && <span className={styles.unit}>{unit}</span>}
                </span>
            )}
        </div>
    );
};

export const ProfilePage: React.FC<{ token: string }> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Загружаем одновременно и данные пользователя, и данные профиля
        const [userRes, profileRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/users/me', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://127.0.0.1:8000/profile/me', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!userRes.ok || !profileRes.ok) throw new Error('Не удалось загрузить данные.');
        
        const userData = await userRes.json();
        const profileData = await profileRes.json();

        setUser(userData);
        setProfile(profileData);
        // Заполняем форму начальными данными из обоих источников
        setFormData({ ...userData, ...profileData });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
        fetchAllData();
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Для полей с числами преобразуем, для остальных оставляем текст
    const isNumeric = name !== 'first_name' && name !== 'last_name' && name !== 'address' && name !== 'attached_clinic' && name !== 'emergency_contact_name' && name !== 'emergency_contact_phone';
    const processedValue = isNumeric ? (value === '' ? null : parseFloat(value)) : value;
    setFormData((prev: any) => ({ ...prev, [name]: processedValue }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        // Отправляем запросы на обновление параллельно
      await Promise.all([
        fetch('http://127.0.0.1:8000/profile/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        }),
        // В будущем здесь будет эндпоинт для обновления данных самого юзера
        // fetch('http://127.0.0.1:8000/users/me', { ... }) 
      ]);

      // Обновляем данные на странице
      setUser(prev => ({...prev, ...formData}));
      setProfile(prev => ({...prev, ...formData}));
      setIsEditMode(false);

    } catch (err) {
      alert('Не удалось сохранить изменения');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setFormData({ ...user, ...profile });
    setIsEditMode(false);
  }

  if (loading) return <p>Загрузка профиля...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!profile || !user) return <p>Профиль не найден. Нажмите "Редактировать", чтобы заполнить.</p>;

  return (
    <div className={styles.profileContainer}>
        <div className={styles.controlsHeader}>
            {isEditMode ? (
                <>
                    <button onClick={handleSave} disabled={loading} className="button button-primary">{loading ? 'Сохранение...' : 'Сохранить'}</button>
                    <button onClick={handleCancel} disabled={loading} className="button button-secondary">Отмена</button>
                </>
            ) : (
                <button onClick={() => setIsEditMode(true)} className="button button-primary">Редактировать</button>
            )}
        </div>

        <div className={styles.grid}>
            {/* Карточка личных данных */}
            <div className={styles.card}>
                <h3>Личные данные</h3>
                <ProfileDataRow label="Имя" name="first_name" value={isEditMode ? formData.first_name : user.first_name} isEditMode={isEditMode} onChange={handleInputChange} />
                <ProfileDataRow label="Фамилия" name="last_name" value={isEditMode ? formData.last_name : user.last_name} isEditMode={isEditMode} onChange={handleInputChange} />
                <ProfileDataRow label="Дата рождения" name="birth_date" type="date" value={isEditMode ? formData.birth_date : user.birth_date} isEditMode={isEditMode} onChange={handleInputChange} />
                <ProfileDataRow label="Email" name="email" value={user.email} isEditMode={false} />
                <ProfileDataRow label="Адрес проживания" name="address" value={isEditMode ? formData.address : profile.address} isEditMode={isEditMode} onChange={handleInputChange} />
                <ProfileDataRow label="Поликлиника прикрепления" name="attached_clinic" value={isEditMode ? formData.attached_clinic : profile.attached_clinic} isEditMode={isEditMode} onChange={handleInputChange} />
            </div>

            {/* Карточка контактов и аллергий */}
            <div className={styles.card}>
                <h3>Здоровье и контакты</h3>
                <ProfileDataRow label="Экстренный контакт" name="emergency_contact_name" value={isEditMode ? formData.emergency_contact_name : profile.emergency_contact_name} isEditMode={isEditMode} onChange={handleInputChange} />
                <ProfileDataRow label="Телефон экст. контакта" name="emergency_contact_phone" value={isEditMode ? formData.emergency_contact_phone : profile.emergency_contact_phone} isEditMode={isEditMode} onChange={handleInputChange} />
                <div className={styles.dataRow}>
                    <span className={styles.label}>Аллергии</span>
                    <div className={styles.tagList}>
                        {user.allergies.length > 0 
                            ? user.allergies.map(a => <span key={a.id} className={styles.tag}>{a.name}</span>) 
                            : 'Не указано'}
                    </div>
                </div>
                 <div className={styles.dataRow}>
                    <span className={styles.label}>Хрон. заболевания</span>
                    <div className={styles.tagList}>
                        {user.chronic_diseases.length > 0 
                            ? user.chronic_diseases.map(d => <span key={d.id} className={styles.tag}>{d.name}</span>) 
                            : 'Не указано'}
                    </div>
                </div>
            </div>

            {/* Карточки антропометрии и биовозраста */}
            {/* Вы можете добавить сюда все остальные поля по аналогии с ProfileDataRow */}
        </div>
    </div>
  );
};