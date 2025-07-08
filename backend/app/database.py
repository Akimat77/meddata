# backend/app/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings # Импортируем наши настройки

# Создаем "движок" для подключения к базе данных по адресу из конфига
engine = create_engine(settings.DATABASE_URL)

# Создаем фабрику сессий, через которую мы будем делать запросы
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для всех наших моделей таблиц
Base = declarative_base()

# Функция для получения сессии базы данных в эндпоинтах
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()