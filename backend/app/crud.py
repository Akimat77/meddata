# backend/app/crud.py

from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from . import models, schemas, security

# --- Функции для Пользователя ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, hashed_password=hashed_password,
        first_name=user.first_name, last_name=user.last_name, birth_date=user.birth_date
    )
    if user.allergy_ids:
        db_user.allergies.extend(db.query(models.Allergy).filter(models.Allergy.id.in_(user.allergy_ids)).all())
    if user.custom_allergy:
        existing_allergy = db.query(models.Allergy).filter(models.Allergy.name == user.custom_allergy).first()
        if not existing_allergy:
            new_allergy = models.Allergy(name=user.custom_allergy)
            db.add(new_allergy); db.commit(); db.refresh(new_allergy)
            db_user.allergies.append(new_allergy)
        elif existing_allergy not in db_user.allergies:
            db_user.allergies.append(existing_allergy)
    if user.chronic_disease_ids:
        db_user.chronic_diseases.extend(db.query(models.ChronicDisease).filter(models.ChronicDisease.id.in_(user.chronic_disease_ids)).all())
    if user.custom_disease:
        existing_disease = db.query(models.ChronicDisease).filter(models.ChronicDisease.name == user.custom_disease).first()
        if not existing_disease:
            new_disease = models.ChronicDisease(name=user.custom_disease)
            db.add(new_disease); db.commit(); db.refresh(new_disease)
            db_user.chronic_diseases.append(new_disease)
        elif existing_disease not in db_user.chronic_diseases:
            db_user.chronic_diseases.append(existing_disease)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    create_or_update_profile(db=db, profile_data=schemas.ProfileCreate(), user_id=db_user.id)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email=email)
    if not user or not security.verify_password(password, user.hashed_password): return False
    return user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        update_data = user_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit(); db.refresh(db_user)
    return db_user

# --- Функции для Справочников ---
def get_allergies(db: Session): return db.query(models.Allergy).all()
def get_chronic_diseases(db: Session): return db.query(models.ChronicDisease).all()
def find_diseases_by_name(db: Session, query: str) -> List[models.ChronicDisease]:
    if not query: return []
    search_query = f"%{query}%"
    return db.query(models.ChronicDisease).filter(models.ChronicDisease.name.ilike(search_query)).limit(10).all()

# --- Функции для Профиля ---
def get_profile_by_user_id(db: Session, user_id: int):
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
def create_or_update_profile(db: Session, profile_data: schemas.ProfileUpdate, user_id: int):
    db_profile = get_profile_by_user_id(db, user_id=user_id)
    if not db_profile:
        db_profile = models.Profile(**profile_data.dict(), user_id=user_id)
        db.add(db_profile)
    else:
        update_data = profile_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_profile, key, value)
    db.commit(); db.refresh(db_profile)
    return db_profile

# --- Функции для Записей в ленте ---
def get_record_by_id(db: Session, record_id: int, owner_id: int):
    return db.query(models.Record).filter(models.Record.id == record_id, models.Record.owner_id == owner_id).first()
def get_records_by_owner(db: Session, owner_id: int):
    return db.query(models.Record).filter(models.Record.owner_id == owner_id).order_by(models.Record.date.desc()).all()
def create_record(db: Session, record: schemas.RecordCreate, owner_id: int):
    db_record = models.Record(**record.dict(), owner_id=owner_id)
    db.add(db_record); db.commit(); db.refresh(db_record)
    return db_record
def update_record(db: Session, record_id: int, owner_id: int, record_data: schemas.RecordCreate):
    db_record = get_record_by_id(db=db, record_id=record_id, owner_id=owner_id)
    if db_record:
        update_data = record_data.dict()
        for key, value in update_data.items():
            setattr(db_record, key, value)
        db.commit(); db.refresh(db_record)
    return db_record
def delete_record(db: Session, record_id: int, owner_id: int):
    db_record = get_record_by_id(db=db, record_id=record_id, owner_id=owner_id)
    if db_record: db.delete(db_record); db.commit()
    return db_record

# --- Функции для Замеров (Vitals) ---
def create_vitals_record(db: Session, vitals_data: schemas.VitalsRecordCreate, user_id: int):
    db_vitals = models.VitalsRecord(**vitals_data.dict(), owner_id=user_id)
    db.add(db_vitals); db.commit(); db.refresh(db_vitals)
    return db_vitals
def get_vitals_by_user(db: Session, user_id: int):
    return db.query(models.VitalsRecord).filter(models.VitalsRecord.owner_id == user_id).order_by(models.VitalsRecord.timestamp.desc()).all()

# --- Функции для Напоминаний ---
def create_reminder(db: Session, reminder: schemas.ReminderCreate, owner_id: int):
    db_reminder = models.Reminder(**reminder.dict(), owner_id=owner_id)
    db.add(db_reminder); db.commit(); db.refresh(db_reminder)
    return db_reminder
def get_reminders_by_owner(db: Session, owner_id: int):
    return db.query(models.Reminder).filter(models.Reminder.owner_id == owner_id).order_by(models.Reminder.time).all()
def update_reminder(db: Session, reminder_id: int, reminder_data: schemas.ReminderCreate, owner_id: int):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id, models.Reminder.owner_id == owner_id).first()
    if db_reminder:
        update_data = reminder_data.dict(exclude_unset=True)
        for key, value in update_data.items(): setattr(db_reminder, key, value)
        db.commit(); db.refresh(db_reminder)
    return db_reminder
def delete_reminder(db: Session, reminder_id: int, owner_id: int):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id, models.Reminder.owner_id == owner_id).first()
    if db_reminder: db.delete(db_reminder); db.commit()
    return db_reminder

# --- НАЧАЛО НОВЫХ ФУНКЦИЙ ДЛЯ ЖАЛОБ ---

def create_complaint(db: Session, complaint: schemas.ComplaintCreate, owner_id: int):
    """Создает новую жалобу для пользователя."""
    db_complaint = models.Complaint(**complaint.dict(), owner_id=owner_id)
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def get_complaints_by_owner(db: Session, owner_id: int):
    """Получает все жалобы конкретного пользователя."""
    return db.query(models.Complaint).filter(models.Complaint.owner_id == owner_id).order_by(models.Complaint.created_at.desc()).all()

# --- Функции для Курсов Лечения ---
def create_treatment_course(db: Session, course: schemas.TreatmentCourseCreate, owner_id: int):
    db_course = models.TreatmentCourse(**course.dict(), owner_id=owner_id)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def get_courses_by_owner(db: Session, owner_id: int):
    """
    Получает все курсы пользователя, сразу подгружая связанные 
    записи и жалобы для эффективности.
    """
    return db.query(models.TreatmentCourse).options(
        joinedload(models.TreatmentCourse.records),
        joinedload(models.TreatmentCourse.complaints)
    ).filter(models.TreatmentCourse.owner_id == owner_id).order_by(models.TreatmentCourse.start_date.desc()).all()



# --- КОНЕЦ НОВЫХ ФУНКЦИЙ ---