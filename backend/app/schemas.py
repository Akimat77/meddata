# backend/app/schemas.py

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from datetime import time
# --- Базовая конфигурация для всех схем ---
class _BaseConfig:
    orm_mode = True

# --- Схемы для Справочников ---
class Allergy(BaseModel):
    id: int
    name: str
    class Config(_BaseConfig): pass

class ChronicDisease(BaseModel):
    id: int
    name: str
    icd10_code: Optional[str] = None
    class Config(_BaseConfig): pass

# --- Схемы для Замеров (Vitals) ---
class VitalsRecordBase(BaseModel):
    type: str
    value: float
    unit: str
    timestamp: Optional[datetime] = None

class VitalsRecordCreate(VitalsRecordBase): pass

class VitalsRecord(VitalsRecordBase):
    id: int
    owner_id: int
    class Config(_BaseConfig): pass

# --- Схемы для Записей в ленте ---
class RecordBase(BaseModel):
    date: datetime
    resource_type: str
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None
    patient_complaints: Optional[str] = None
    conclusion_text: Optional[str] = None
    diagnosis_code: Optional[str] = None
    medication_name: Optional[str] = None
    attachment_url: Optional[str] = None
    lab_name: Optional[str] = None
    test_name: Optional[str] = None
    result: Optional[str] = None
    reference_range: Optional[str] = None

class RecordCreate(RecordBase): pass

class RecordForTimeline(RecordBase):
    id: int
    class Config(_BaseConfig): pass

# --- Схемы для Профиля ---
class ProfileBase(BaseModel):
    address: Optional[str] = None
    attached_clinic: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    height: Optional[float] = None
    weight: Optional[float] = None
    optimal_weight: Optional[float] = None
    body_mass_index: Optional[float] = None
    basal_metabolism: Optional[int] = None
    skeletal_muscle_mass: Optional[float] = None
    fat_mass_kg: Optional[float] = None
    fat_mass_percent: Optional[float] = None
    waist_hip_ratio: Optional[float] = None
    waist_circumference: Optional[float] = None
    fat_correction: Optional[float] = None
    muscle_correction: Optional[float] = None
    visceral_fat: Optional[int] = None
    subcutaneous_fat: Optional[float] = None
    total_bio_age: Optional[int] = None
    physical_age: Optional[int] = None
    vascular_age: Optional[int] = None
    cardio_age: Optional[int] = None
    immune_age: Optional[int] = None
    metabolic_age: Optional[int] = None
    joint_age: Optional[int] = None
    kidney_age: Optional[int] = None

class ProfileCreate(ProfileBase): pass
class ProfileUpdate(ProfileBase): pass

class Profile(ProfileBase):
    id: int
    user_id: int
    class Config(_BaseConfig): pass

# --- Схемы для Пользователя ---
class UserBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None

class UserCreate(UserBase):
    password: str
    custom_allergy: Optional[str] = None
    # --- НАЧАЛО ИЗМЕНЕНИЙ ---
    custom_disease: Optional[str] = None # Поле для нового заболевания
    # --- КОНЕЦ ИЗМЕНЕНИЙ ---
    allergy_ids: Optional[List[int]] = []
    chronic_disease_ids: Optional[List[int]] = []

class User(UserBase):
    id: int
    is_active: bool
    allergies: List[Allergy] = []
    chronic_diseases: List[ChronicDisease] = []
    class Config(_BaseConfig): pass

# --- Схемы для Токена и Обмена данными ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class SharedHealthData(BaseModel):
    profile: Profile
    records: List[RecordForTimeline]
    vitals: List[VitalsRecord]
    class Config(_BaseConfig): pass
    
class ReminderBase(BaseModel):
    title: str
    time: time
    days_of_week: List[int] # Список дней недели [0, 1, 2, 3, 4, 5, 6]
    is_active: bool = True

class ReminderCreate(ReminderBase):
    pass

class Reminder(ReminderBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True