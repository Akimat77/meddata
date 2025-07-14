# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, Table, Date
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
from sqlalchemy import Time, ARRAY

user_allergy_association = Table('user_allergy_association', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('allergy_id', Integer, ForeignKey('allergies.id'), primary_key=True)
)
user_disease_association = Table('user_disease_association', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('disease_id', Integer, ForeignKey('chronic_diseases.id'), primary_key=True)
)

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String, nullable=False) # Напр. "Выпить Витамин D" или "Замерить сахар"
    time = Column(Time, nullable=False) # Время напоминания, напр. 09:00
    # Дни недели для повторения: 0=Пн, 1=Вт, ..., 6=Вс
    days_of_week = Column(ARRAY(Integer), nullable=True) 
    is_active = Column(Boolean, default=True)
    
    owner = relationship("User")

class Allergy(Base):
    __tablename__ = "allergies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class ChronicDisease(Base):
    __tablename__ = "chronic_diseases"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    icd10_code = Column(String, unique=True, nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    records = relationship("Record", back_populates="owner")
    profile = relationship("Profile", back_populates="user", uselist=False)
    allergies = relationship("Allergy", secondary=user_allergy_association, backref="users")
    chronic_diseases = relationship("ChronicDisease", secondary=user_disease_association, backref="users")
    vitals = relationship("VitalsRecord", back_populates="owner")
    reminders = relationship("Reminder", back_populates="owner")
    complaints = relationship("Complaint", back_populates="owner")
    courses = relationship("TreatmentCourse", back_populates="owner")

class VitalsRecord(Base):
    __tablename__ = "vitals_records"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    type = Column(String, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String)
    owner = relationship("User", back_populates="vitals")

class Record(Base):
    __tablename__ = "records"
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    doctor_name = Column(String, nullable=True)
    clinic_name = Column(String, nullable=True)
    patient_complaints = Column(Text, nullable=True)
    conclusion_text = Column(Text, nullable=True)
    diagnosis_code = Column(String, nullable=True)
    medication_name = Column(String, nullable=True)
    attachment_url = Column(String, nullable=True)
    lab_name = Column(String, nullable=True)
    test_name = Column(String, nullable=True)
    result = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("treatment_courses.id"), nullable=True)
    owner = relationship("User", back_populates="records")
    course = relationship("TreatmentCourse", back_populates="records")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    address = Column(String, nullable=True)
    attached_clinic = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    optimal_weight = Column(Float, nullable=True)
    body_mass_index = Column(Float, nullable=True)
    basal_metabolism = Column(Integer, nullable=True)
    skeletal_muscle_mass = Column(Float, nullable=True)
    fat_mass_kg = Column(Float, nullable=True)
    fat_mass_percent = Column(Float, nullable=True)
    waist_hip_ratio = Column(Float, nullable=True)
    waist_circumference = Column(Float, nullable=True)
    fat_correction = Column(Float, nullable=True)
    muscle_correction = Column(Float, nullable=True)
    visceral_fat = Column(Integer, nullable=True)
    subcutaneous_fat = Column(Float, nullable=True)
    total_bio_age = Column(Integer, nullable=True)
    physical_age = Column(Integer, nullable=True)
    vascular_age = Column(Integer, nullable=True)
    cardio_age = Column(Integer, nullable=True)
    immune_age = Column(Integer, nullable=True)
    metabolic_age = Column(Integer, nullable=True)
    joint_age = Column(Integer, nullable=True)
    kidney_age = Column(Integer, nullable=True)
    user = relationship("User", back_populates="profile")

class TreatmentCourse(Base):
    __tablename__ = "treatment_courses"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=True)
    status = Column(String, default="active")
    owner = relationship("User", back_populates="courses")
    records = relationship("Record", back_populates="course")
    complaints = relationship("Complaint", back_populates="course")

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("treatment_courses.id"), nullable=True)
    complaint_text = Column(Text, nullable=False)
    start_date = Column(Date, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="complaints")
    course = relationship("TreatmentCourse", back_populates="complaints")