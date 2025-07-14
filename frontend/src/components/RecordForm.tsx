// frontend/src/components/RecordForm.tsx

import React, { useState, useEffect } from 'react';
import { Record as RecordData, RecordCreate, ChronicDisease, TreatmentCourse } from '../types';
import styles from './RecordForm.module.css';

interface RecordFormProps {
  onClose: () => void;
  onRecordAdded: (newRecord: RecordData) => void;
  onRecordUpdated: (updatedRecord: RecordData) => void;
  token: string;
  existingRecord: RecordData | null;
}

export const RecordForm: React.FC<RecordFormProps> = ({ onClose, onRecordAdded, onRecordUpdated, token, existingRecord }) => {
  const isEditMode = !!existingRecord;
  
  const [recordType, setRecordType] = useState<'Encounter' | 'Observation'>(
    isEditMode ? existingRecord!.resource_type as any : 'Encounter'
  );

  // Состояния для всех полей
  const [date, setDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [patientComplaints, setPatientComplaints] = useState('');
  const [conclusionText, setConclusionText] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [labName, setLabName] = useState('');
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState('');
  const [range, setRange] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Состояния для поиска и курсов
  const [diagnosisQuery, setDiagnosisQuery] = useState('');
  const [icdResults, setIcdResults] = useState<ChronicDisease[]>([]);
  const [courses, setCourses] = useState<TreatmentCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Заполняем форму данными при редактировании
  useEffect(() => {
    if (isEditMode && existingRecord) {
      setDate(existingRecord.date.split('T')[0]);
      setDoctorName(existingRecord.doctor_name || '');
      setClinicName(existingRecord.clinic_name || '');
      setPatientComplaints(existingRecord.patient_complaints || '');
      setConclusionText(existingRecord.conclusion_text || '');
      setDiagnosisCode(existingRecord.diagnosis_code || '');
      setMedicationName(existingRecord.medication_name || '');
      setLabName(existingRecord.lab_name || '');
      setTestName(existingRecord.test_name || '');
      setResult(existingRecord.result || '');
      setRange(existingRecord.reference_range || '');
      setSelectedCourseId(existingRecord.course_id || null);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isEditMode, existingRecord]);

  // Загружаем список курсов лечения
  useEffect(() => {
    const fetchCourses = async () => {
        if (token) {
            try {
                const response = await fetch('http://127.0.0.1:8000/courses/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    setCourses(await response.json());
                }
            } catch (error) {
                console.error("Не удалось загрузить курсы лечения", error);
            }
        }
    };
    fetchCourses();
  }, [token]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFindIcdCode = async () => {
    if (!diagnosisQuery.trim()) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/diagnoses/find-icd?q=${encodeURIComponent(diagnosisQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setIcdResults(await response.json());
    } catch (error) { console.error("Ошибка поиска МКБ-10:", error); }
  };

  const handleSelectIcdCode = (disease: ChronicDisease) => {
    setDiagnosisCode(disease.icd10_code || 'Не найден');
    setDiagnosisQuery(disease.name);
    if (!conclusionText.includes(disease.name)) {
        setConclusionText(prev => `${disease.name}. ${prev}`.trim());
    }
    setIcdResults([]);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    
    formData.append('date', new Date(date).toISOString());
    formData.append('resource_type', recordType);
    formData.append('doctor_name', doctorName);
    formData.append('clinic_name', clinicName);
    formData.append('patient_complaints', patientComplaints);
    formData.append('conclusion_text', conclusionText);
    formData.append('diagnosis_code', diagnosisCode);
    formData.append('medication_name', medicationName);
    formData.append('lab_name', labName);
    formData.append('test_name', testName);
    formData.append('result', result);
    formData.append('reference_range', range);
    if (selectedCourseId) formData.append('course_id', String(selectedCourseId));
    if (selectedFile) formData.append('file', selectedFile);

    const url = isEditMode ? `http://127.0.0.1:8000/records/${existingRecord!.id}` : `http://127.0.0.1:8000/records/`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        if (!response.ok) throw new Error('Ошибка при сохранении');
        const savedRecord: RecordData = await response.json();
        if (isEditMode) onRecordUpdated(savedRecord);
        else onRecordAdded(savedRecord);
    } catch (error) {
        console.error("Ошибка:", error);
        alert(`Не удалось сохранить запись.`);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <div className={styles.formContainer}>
      <h3>{isEditMode ? `Редактирование: ${existingRecord?.resource_type === 'Encounter' ? 'Визит к врачу' : 'Результат анализа'}` : 'Новая запись'}</h3>
      
      {!isEditMode && (
        <div className={styles.formGroup}>
          <label>Тип записи</label>
          <select value={recordType} onChange={(e) => setRecordType(e.target.value as any)} className={styles.input}>
            <option value="Encounter">Визит к врачу</option>
            <option value="Observation">Результат анализа</option>
          </select>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="course">Привязать к курсу лечения (необязательно)</label>
        <select 
            id="course"
            className={styles.input} 
            value={selectedCourseId || ''} 
            onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
        >
            <option value="">Без курса</option>
            {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
            ))}
        </select>
      </div>
      <hr className={styles.divider} />

      {recordType === 'Encounter' ? (
        <>
            <div className={styles.grid}>
                <div><label>Дата визита</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={styles.input} required /></div>
                <div><label>Клиника</label><input type="text" placeholder="Напр. МЦ 'Sana Vita'" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className={styles.input} /></div>
            </div>
            <div className={styles.formGroup}><label>Врач</label><input type="text" placeholder="Напр. Терапевт, Петрова А. И." value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className={styles.input} /></div>
            <div className={styles.formGroup}><label>Жалобы</label><textarea value={patientComplaints} onChange={(e) => setPatientComplaints(e.target.value)} rows={3} className={styles.textarea} /></div>
            <div className={styles.formGroup}><label>Заключение / Предварительный диагноз</label><textarea value={conclusionText} onChange={(e) => setConclusionText(e.target.value)} rows={3} className={styles.textarea} /></div>
            
            <div className={styles.formGroup}>
              <label>Поиск кода МКБ-10 по названию</label>
              <div className={styles.searchBox}>
                  <input type="text" placeholder="Начните вводить диагноз..." value={diagnosisQuery} onChange={(e) => setDiagnosisQuery(e.target.value)} className={styles.input}/>
                  <button type="button" onClick={handleFindIcdCode} className={styles.searchButton}>Найти</button>
              </div>
              {icdResults.length > 0 && (
                <div className={styles.resultsBox}>
                  {icdResults.map(disease => (
                    <div key={disease.id} className={styles.resultItem} onClick={() => handleSelectIcdCode(disease)}>
                      <strong>{disease.icd10_code}</strong> - {disease.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          
            <div className={styles.grid}>
                <div><label>Итоговый код (МКБ-10)</label><input type="text" placeholder="Заполнится после выбора" value={diagnosisCode} onChange={(e) => setDiagnosisCode(e.target.value)} className={styles.input} /></div>
                <div><label>Ключевой препарат</label><input type="text" placeholder="Напр. Метформин" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} className={styles.input} /></div>
            </div>
        </>
      ) : (
        <>
            <div className={styles.grid}>
                <div><label>Дата анализа</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={styles.input} required /></div>
                <div><label>Лаборатория</label><input type="text" placeholder="Напр. Invivo" value={labName} onChange={(e) => setLabName(e.target.value)} className={styles.input} /></div>
            </div>
            <div className={styles.formGroup}><label>Название анализа</label><input type="text" placeholder="Напр. Гликированный гемоглобин" value={testName} onChange={(e) => setTestName(e.target.value)} className={styles.input} required /></div>
            <div className={styles.grid}>
                <div><label>Результат</label><input type="text" placeholder="Напр. 8.5" value={result} onChange={(e) => setResult(e.target.value)} className={styles.input} /></div>
                <div><label>Норма (референс)</label><input type="text" placeholder="Напр. < 6.5 %" value={range} onChange={(e) => setRange(e.target.value)} className={styles.input} /></div>
            </div>
        </>
      )}

      <div className={styles.formGroup}><label>Прикрепить файл</label><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} /></div>
      
      <div className={styles.controls}>
          <button onClick={handleSave} disabled={isSubmitting} className={styles.button}>Сохранить</button>
          <button onClick={onClose} disabled={isSubmitting} className={styles.buttonSecondary}>Отмена</button>
      </div>
    </div>
  );
};