# backend/app/main.py

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from datetime import timedelta, datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt
import shutil
import os

from . import crud, models, schemas, security
from .database import engine, get_db
from .config import settings

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="MedData.KZ API")

origins = ["*"]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Эндпоинты аутентификации ---
@app.post("/users/", response_model=schemas.User)
def create_user_endpoint(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

# --- Эндпоинты для обмена данными ---
@app.post("/share/generate-token", response_model=schemas.Token)
def generate_sharing_token(current_user: models.User = Depends(security.get_current_active_user)):
    token_data = {"sub": current_user.email, "scope": "sharing"}
    token = security.create_access_token(data=token_data, expires_delta=timedelta(minutes=10))
    return {"access_token": token, "token_type": "bearer"}

@app.get("/share/view/{token}", response_model=schemas.SharedHealthData)
def view_shared_data(token: str, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ссылка недействительна или срок ее действия истек")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub"); scope: Optional[str] = payload.get("scope")
        if email is None or scope != "sharing": raise credentials_exception
    except JWTError: raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None: raise credentials_exception
    profile = crud.get_profile_by_user_id(db, user_id=user.id)
    if profile is None: raise HTTPException(status_code=404, detail="Профиль не найден")
    records = crud.get_records_by_owner(db, owner_id=user.id)
    vitals = crud.get_vitals_by_user(db, user_id=user.id)
    return schemas.SharedHealthData(profile=profile, records=records, vitals=vitals)

# --- Эндпоинты для справочников ---
@app.get("/allergies/", response_model=List[schemas.Allergy])
def read_allergies(db: Session = Depends(get_db)): return crud.get_allergies(db)

@app.get("/chronic-diseases/", response_model=List[schemas.ChronicDisease])
def read_chronic_diseases(db: Session = Depends(get_db)): return crud.get_chronic_diseases(db)

@app.get("/diagnoses/find-icd", response_model=List[schemas.ChronicDisease])
def find_icd_code_by_text(q: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.find_diseases_by_name(db=db, query=q)

# --- ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ ---
@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(security.get_current_active_user)): return current_user

@app.get("/profile/me", response_model=schemas.Profile)
def read_user_profile(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    profile = crud.get_profile_by_user_id(db, user_id=current_user.id)
    if profile is None: raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile

@app.put("/profile/me", response_model=schemas.Profile)
def update_user_profile(profile_data: schemas.ProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.create_or_update_profile(db=db, profile_data=profile_data, user_id=current_user.id)

@app.get("/vitals/", response_model=List[schemas.VitalsRecord])
def read_vitals_for_user(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)): return crud.get_vitals_by_user(db=db, user_id=current_user.id)

@app.post("/vitals/", response_model=schemas.VitalsRecord)
def create_vitals_for_user(vitals_data: schemas.VitalsRecordCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.create_vitals_record(db=db, vitals_data=vitals_data, user_id=current_user.id)

@app.get("/records/", response_model=List[schemas.RecordForTimeline])
def read_user_records(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.get_records_by_owner(db=db, owner_id=current_user.id)

@app.post("/records/", response_model=schemas.RecordForTimeline)
def create_user_record(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user), date: datetime = Form(...), resource_type: str = Form(...), course_id: Optional[int] = Form(None), doctor_name: Optional[str] = Form(None), clinic_name: Optional[str] = Form(None), patient_complaints: Optional[str] = Form(None), conclusion_text: Optional[str] = Form(None), diagnosis_code: Optional[str] = Form(None), medication_name: Optional[str] = Form(None), lab_name: Optional[str] = Form(None),
    test_name: Optional[str] = Form(None),
    result: Optional[str] = Form(None),
    reference_range: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)):
    attachment_url_to_save = None
    if file and file.filename:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{current_user.id}_{int(datetime.now().timestamp())}{file_extension}"
        file_path = os.path.join("uploads", unique_filename)
        with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        attachment_url_to_save = f"/uploads/{unique_filename}"
    record_data = schemas.RecordCreate(date=date, resource_type=resource_type, doctor_name=doctor_name, clinic_name=clinic_name, patient_complaints=patient_complaints, conclusion_text=conclusion_text, diagnosis_code=diagnosis_code, medication_name=medication_name, attachment_url=attachment_url_to_save, lab_name=lab_name, test_name=test_name, result=result, reference_range=reference_range, course_id=course_id)
    return crud.create_record(db=db, record=record_data, owner_id=current_user.id)

@app.put("/records/{record_id}", response_model=schemas.RecordForTimeline)
def update_user_record(record_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user), date: datetime = Form(...), resource_type: str = Form(...), course_id: Optional[int] = Form(None), doctor_name: Optional[str] = Form(None), clinic_name: Optional[str] = Form(None), patient_complaints: Optional[str] = Form(None), conclusion_text: Optional[str] = Form(None), diagnosis_code: Optional[str] = Form(None), medication_name: Optional[str] = Form(None), lab_name: Optional[str] = Form(None),test_name: Optional[str] = Form(None),result: Optional[str] = Form(None),reference_range: Optional[str] = Form(None),attachment_url: Optional[str] = Form(None), file: Optional[UploadFile] = File(None)):
    existing_record = crud.get_record_by_id(db=db, record_id=record_id, owner_id=current_user.id)
    if not existing_record: raise HTTPException(status_code=404, detail="Record not found or access denied")
    attachment_url_to_save = existing_record.attachment_url
    if file and file.filename:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{current_user.id}_{int(datetime.now().timestamp())}{file_extension}"
        file_path = os.path.join("uploads", unique_filename)
        with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        attachment_url_to_save = f"/uploads/{unique_filename}"
    record_data = schemas.RecordCreate(date=date, resource_type=resource_type, doctor_name=doctor_name, clinic_name=clinic_name, patient_complaints=patient_complaints, conclusion_text=conclusion_text, diagnosis_code=diagnosis_code, medication_name=medication_name, attachment_url=attachment_url_to_save,lab_name=lab_name, test_name=test_name, result=result, reference_range=reference_range, course_id=course_id)
    updated_record = crud.update_record(db=db, record_id=record_id, owner_id=current_user.id, record_data=record_data)
    if updated_record is None: raise HTTPException(status_code=404, detail="Record not found or access denied")
    return updated_record

@app.delete("/records/{record_id}", response_model=schemas.RecordForTimeline)
def delete_user_record(record_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    deleted_record = crud.delete_record(db=db, record_id=record_id, owner_id=current_user.id)
    if deleted_record is None: raise HTTPException(status_code=404, detail="Record not found or access denied")
    return deleted_record

# --- защищенный ЭНДПОИНТы ДЛЯ ЖАЛОБ ---

@app.post("/complaints/", response_model=schemas.Complaint)
def create_new_complaint(
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Создать новую жалобу."""
    return crud.create_complaint(db=db, complaint=complaint, owner_id=current_user.id)

@app.get("/complaints/", response_model=List[schemas.Complaint])
def read_user_complaints(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    """Получить все жалобы текущего пользователя."""
    return crud.get_complaints_by_owner(db=db, owner_id=current_user.id)


# --- Эндпоинты для напоминаний ---
@app.get("/reminders/", response_model=List[schemas.Reminder])
def read_user_reminders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.get_reminders_by_owner(db=db, owner_id=current_user.id)

@app.post("/reminders/", response_model=schemas.Reminder)
def create_new_reminder(reminder: schemas.ReminderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.create_reminder(db=db, reminder=reminder, owner_id=current_user.id)

@app.put("/reminders/{reminder_id}", response_model=schemas.Reminder)
def update_existing_reminder(reminder_id: int, reminder_data: schemas.ReminderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    updated_reminder = crud.update_reminder(db=db, reminder_id=reminder_id, reminder_data=reminder_data, owner_id=current_user.id)
    if updated_reminder is None: raise HTTPException(status_code=404, detail="Напоминание не найдено")
    return updated_reminder

@app.delete("/reminders/{reminder_id}", response_model=schemas.Reminder)
def delete_existing_reminder(reminder_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    deleted_reminder = crud.delete_reminder(db=db, reminder_id=reminder_id, owner_id=current_user.id)
    if deleted__reminder is None: raise HTTPException(status_code=404, detail="Напоминание не найдено")
    return deleted_reminder

# --- НОВЫЕ ЭНДПОИНТЫ ДЛЯ КУРСОВ ЛЕЧЕНИЯ И ЖАЛОБ ---
@app.post("/courses/", response_model=schemas.TreatmentCourse)
def create_treatment_course_for_user(course: schemas.TreatmentCourseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.create_treatment_course(db=db, course=course, owner_id=current_user.id)

@app.get("/courses/", response_model=List[schemas.TreatmentCourse])
def read_courses_for_user(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.get_courses_by_owner(db=db, owner_id=current_user.id)

@app.post("/complaints/", response_model=schemas.Complaint)
def create_new_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.create_complaint(db=db, complaint=complaint, owner_id=current_user.id)

@app.get("/complaints/", response_model=List[schemas.Complaint])
def read_user_complaints(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_active_user)):
    return crud.get_complaints_by_owner(db=db, owner_id=current_user.id)

# --- Служебный эндпоинт ---
@app.get("/seed-initial-data")
def seed_initial_data(db: Session = Depends(get_db)):
    if db.query(models.Allergy).count() == 0:
        allergies_to_add = [ models.Allergy(name="Пенициллин"), models.Allergy(name="Аспирин"), models.Allergy(name="Пыльца растений"), models.Allergy(name="Шерсть животных"), models.Allergy(name="Орехи"), ]
        db.add_all(allergies_to_add)
    if db.query(models.ChronicDisease).count() == 0:
        diseases_to_add = [ models.ChronicDisease(name="Сахарный диабет 2 типа", icd10_code="E11"), models.ChronicDisease(name="Артериальная гипертензия", icd10_code="I10"), models.ChronicDisease(name="Бронхиальная астма", icd10_code="J45"), models.ChronicDisease(name="Хроническая болезнь почек (ХБП)", icd10_code="N18"), models.ChronicDisease(name="Ревматоидный артрит", icd10_code="M05"), models.ChronicDisease(name="Остеоартроз", icd10_code="M15"), models.ChronicDisease(name="Гастрит и дуоденит", icd10_code="K29"), ]
        db.add_all(diseases_to_add)
    db.commit()
    return {"status": "Initial data seeded successfully"}