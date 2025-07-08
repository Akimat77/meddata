// frontend/src/App.tsx

import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { HealthTimeline } from './components/HealthTimeline';
import { ProfilePage } from './components/ProfilePage';
import { VitalsDashboard } from './components/VitalsDashboard';
import { RecordForm } from './components/RecordForm';
import { Record as RecordData } from './types';
import { ShareModal } from './components/ShareModal';
import { DoctorViewPage } from './components/DoctorViewPage';
import { RemindersPage } from './components/RemindersPage'; // Импортируем новый компонент
import './App.css';

const AppRouter: React.FC = () => {
  const path = window.location.pathname;
  const pathParts = path.split('/');
  if (pathParts[1] === 'view' && pathParts[2]) {
    return <DoctorViewPage token={pathParts[2]} />;
  }
  return <MainApp />;
}

function MainApp() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setFormVisible] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [editingRecord, setEditingRecord] = useState<RecordData | null>(null);
  const [mainView, setMainView] = useState<'profile' | 'timeline' | 'vitals' | 'reminders'>('profile');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingToken, setSharingToken] = useState<string | null>(null);

  // --- Новое состояние для интеграции напоминаний ---
  const [prefilledReminder, setPrefilledReminder] = useState<string | null>(null);

  useEffect(() => {
    if (token && mainView === 'timeline') {
      const fetchRecords = async () => {
        setLoading(true); setError(null);
        try {
          const response = await fetch('http://127.0.0.1:8000/records/', { headers: { 'Authorization': `Bearer ${token}` }});
          if (!response.ok) {
            if (response.status === 401) handleLogout();
            throw new Error('Не удалось загрузить записи.');
          }
          setRecords(await response.json());
        } catch (err: any) { setError(err.message);
        } finally { setLoading(false); }
      };
      fetchRecords();
    }
  }, [token, mainView]);

  const handleLoginSuccess = (newToken: string) => { localStorage.setItem('authToken', newToken); setToken(newToken); };
  const handleLogout = () => { localStorage.removeItem('authToken'); setToken(null); setRecords([]); };
  const handleRecordAdded = (newRecord: RecordData) => { setRecords([newRecord, ...records].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())); setFormVisible(false); };
  const handleRecordUpdated = (updatedRecord: RecordData) => { setRecords(records.map(r => r.id === updatedRecord.id ? updatedRecord : r).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())); setFormVisible(false); setEditingRecord(null); };
  const handleDeleteRecord = async (recordId: number) => { if (window.confirm('Вы уверены?')) { try { const response = await fetch(`http://127.0.0.1:8000/records/${recordId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token!}` } }); if (!response.ok) throw new Error('Ошибка удаления'); setRecords(records.filter(r => r.id !== recordId)); } catch (error) { alert('Не удалось удалить запись'); } } };
  const openEditForm = (record: RecordData) => { setEditingRecord(record); setFormVisible(true); };
  const closeForm = () => { setFormVisible(false); setEditingRecord(null); }
  const handleGenerateShareToken = async () => { if (!token) return; try { const response = await fetch('http://127.0.0.1:8000/share/generate-token', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); if (!response.ok) throw new Error('Не удалось сгенерировать ссылку'); const data = await response.json(); setSharingToken(data.access_token); setIsShareModalOpen(true); } catch (error) { alert('Ошибка при создании ссылки для обмена.'); console.error(error); } };
  
  // --- Новые функции для интеграции напоминаний ---
  const handleCreateReminderFromRecord = (medicationName: string) => {
    setPrefilledReminder(medicationName);
    setMainView('reminders');
  };
  const clearPrefilledReminder = () => {
    setPrefilledReminder(null);
  };

  const renderAuthForms = () => {
    if (authView === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setAuthView('register')} />;
    return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
  };

  const renderDashboard = () => (
    <>
      <div className="dashboard-header">
        <h2>Мой паспорт здоровья</h2>
        <div className="view-switcher">
            <button onClick={() => setMainView('profile')} className={mainView === 'profile' ? 'active' : ''}>Профиль</button>
            <button onClick={() => setMainView('vitals')} className={mainView === 'vitals' ? 'active' : ''}>Мониторинг</button>
            <button onClick={() => setMainView('timeline')} className={mainView === 'timeline' ? 'active' : ''}>Лента здоровья</button>
            <button onClick={() => setMainView('reminders')} className={mainView === 'reminders' ? 'active' : ''}>Напоминания</button>
        </div>
        <div className="dashboard-controls">
          <button onClick={handleGenerateShareToken} className="button button-primary">Поделиться с врачом</button>
          <button onClick={handleLogout} className="button button-secondary">Выйти</button>
        </div>
      </div>
      <div className="main-content-container">
        {mainView === 'profile' && token && <ProfilePage token={token} />}
        {mainView === 'vitals' && token && <VitalsDashboard token={token} />}
        {mainView === 'reminders' && token && (
          <RemindersPage 
            token={token} 
            prefilledTitle={prefilledReminder}
            onTitleConsumed={clearPrefilledReminder}
          />
        )}
        {mainView === 'timeline' && (
            <div className="timeline-view">
                {!isFormVisible && <button onClick={() => { setEditingRecord(null); setFormVisible(true); }} className="button button-primary">+ Добавить запись</button>}
                {isFormVisible && <RecordForm onClose={closeForm} onRecordAdded={handleRecordAdded} onRecordUpdated={handleRecordUpdated} token={token!} existingRecord={editingRecord} />}
                {loading && <p>Загрузка...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                  <HealthTimeline 
                    records={records} 
                    onEdit={openEditForm}
                    onDelete={handleDeleteRecord}
                    token={token!}
                    onCreateReminder={handleCreateReminderFromRecord}
                  />
                )}
            </div>
        )}
      </div>
      {isShareModalOpen && sharingToken && <ShareModal token={sharingToken} onClose={() => setIsShareModalOpen(false)} />}
    </>
  );

  return <div className="App">{token ? renderDashboard() : renderAuthForms()}</div>;
}

export default AppRouter;